import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { STORAGE_BUCKETS } from '@/config/constants'
import { useAuthStore } from '@/store/authStore'
import { promoteInspectionStatus } from '@/lib/inspectionStatus'
import { db } from '@/lib/offlineDb'
import { withOfflineFallback } from '@/lib/queryWithOffline'
import { saveReportOffline } from '@/lib/offlineMutations'
import { getBlobUrl } from '@/lib/offlineStorage'
import type { Report } from '@/types/domain'

// ─── Query: list all reports for user ────────────────────────────────────────

export function useReports() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['reports', user?.id],
    queryFn: withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('reports')
          .select('*, inspections(title, address, type)')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Write-through
        if (data) {
          const localRecords = data.map((r) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { inspections, ...rest } = r as Record<string, unknown>
            return { ...rest, _sync_status: 'synced' as const }
          })
          await db.reports.bulkPut(localRecords as never[])
        }

        return data as (Report & {
          inspections: { title: string; address: string; type: string } | null
        })[]
      },
      async () => {
        const reports = await db.reports.toArray()
        reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // Load related inspection info
        const withInspections = await Promise.all(
          reports.map(async (r) => {
            const insp = await db.inspections.get(r.inspection_id)
            return {
              ...r,
              inspections: insp
                ? { title: insp.title, address: insp.address, type: insp.type }
                : null,
            }
          }),
        )

        return withInspections as unknown as (Report & {
          inspections: { title: string; address: string; type: string } | null
        })[]
      },
    ),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Query: reports for a specific inspection ────────────────────────────────

export function useInspectionReports(inspectionId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'inspection', inspectionId],
    queryFn: withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('inspection_id', inspectionId!)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Write-through
        if (data) {
          await db.reports.bulkPut(
            data.map((r) => ({ ...r, _sync_status: 'synced' as const })),
          )
        }

        return data as Report[]
      },
      async () => {
        const results = await db.reports
          .where('inspection_id')
          .equals(inspectionId!)
          .toArray()

        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return results as unknown as Report[]
      },
    ),
    enabled: !!inspectionId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Mutation: save generated report ─────────────────────────────────────────

interface SaveReportParams {
  inspectionId: string
  reportType: 'techniczny' | 'zadania' | 'protokol'
  reportNumber: string
  blob: Blob
}

export function useSaveReport() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ inspectionId, reportType, reportNumber, blob }: SaveReportParams) => {
      if (!user) throw new Error('Nie zalogowano')

      if (!navigator.onLine) {
        // Get current version
        const existing = await db.reports
          .where('inspection_id')
          .equals(inspectionId)
          .toArray()
        const version = existing.filter((r) => r.report_type === reportType).length + 1

        return saveReportOffline(
          { inspectionId, reportNumber, reportType, pdfBlob: blob, version },
          user.id,
        ) as unknown as Report
      }

      // 1. Upload PDF to storage
      const timestamp = Date.now()
      const pdfPath = `${user.id}/${inspectionId}/${reportType}_${timestamp}.pdf`

      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKETS.reportPdfs)
        .upload(pdfPath, blob, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadErr) throw new Error(`Upload PDF nie powiódł się: ${uploadErr.message}`)

      // 2. Get current version number
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_id', inspectionId)
        .eq('report_type', reportType)

      const version = (count || 0) + 1

      // 3. Insert report record
      const { data, error: insertErr } = await supabase
        .from('reports')
        .insert({
          inspection_id: inspectionId,
          report_number: reportNumber,
          report_type: reportType,
          pdf_path: pdfPath,
          version,
        })
        .select()
        .single()

      if (insertErr) throw new Error(`Zapis raportu nie powiódł się: ${insertErr.message}`)

      // Write-through
      await db.reports.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data as Report
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({
        queryKey: ['reports', 'inspection', variables.inspectionId],
      })
      promoteInspectionStatus(variables.inspectionId, 'completed').then(() => {
        queryClient.invalidateQueries({ queryKey: ['inspections'] })
      })
    },
  })
}

// ─── Mutation: send report by email ──────────────────────────────────────────

interface SendReportParams {
  reportId: string
  inspectionId: string
  recipientEmail: string
  message?: string
}

export function useSendReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reportId, recipientEmail, message }: SendReportParams) => {
      if (!navigator.onLine) {
        throw new Error('Wysyłka emaila wymaga połączenia z internetem')
      }

      // Pobierz świeżą sesję bezpośrednio z klienta Supabase (auto-refresh)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Nie zalogowano')

      const { data, error } = await supabase.functions.invoke('send-report-email', {
        body: { reportId, recipientEmail, message },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        throw new Error(error.message || 'Wysyłka emaila nie powiodła się')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      return data as { success: true }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({
        queryKey: ['reports', 'inspection', variables.inspectionId],
      })
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
    },
  })
}


// ─── Helper: get signed download URL ─────────────────────────────────────────

export async function getReportDownloadUrl(pdfPath: string): Promise<string> {
  // Try local blob first (for offline-saved reports)
  const localUrl = await getBlobUrl(pdfPath)
  if (localUrl) return localUrl

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.reportPdfs)
    .createSignedUrl(pdfPath, 3600) // 1 hour

  if (error || !data?.signedUrl) throw new Error('Nie udało się pobrać linku do raportu')
  return data.signedUrl
}
