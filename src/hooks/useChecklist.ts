import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { db } from '@/lib/offlineDb'
import { withOfflineFallback } from '@/lib/queryWithOffline'
import { updateChecklistItemOffline } from '@/lib/offlineMutations'
import type { ChecklistItem, ChecklistItemUpdate } from '@/types/database.types'
import type { Inspection } from '@/types/database.types'

const QUERY_KEY = 'checklist'

export interface ChecklistSection {
  section: string
  items: ChecklistItem[]
}

// ─── Load / Initialize ───────────────────────────────────────────────────────

/**
 * Loads checklist items for an inspection, grouped by section.
 * On first access, creates items from templates if none exist yet.
 */
export function useChecklist(inspectionId: string | undefined, inspectionType: Inspection['type'] | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, inspectionId],
    queryFn: withOfflineFallback(
      async () => {
        // Check if items already exist
        const { data: existing, error: existErr } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('inspection_id', inspectionId!)
          .order('sort_order', { ascending: true })

        if (existErr) throw existErr

        // If items exist, return them grouped
        if (existing && existing.length > 0) {
          // Write-through
          await db.checklist_items.bulkPut(
            existing.map((r) => ({ ...r, _sync_status: 'synced' as const })),
          )
          return groupBySection(existing as ChecklistItem[])
        }

        // No items yet — create from templates
        const { data: templates, error: tplErr } = await supabase
          .from('checklist_templates')
          .select('*')
          .eq('inspection_type', inspectionType!)
          .order('sort_order', { ascending: true })

        if (tplErr) throw tplErr
        if (!templates || templates.length === 0) return []

        // Cache templates locally for offline use
        await db.checklist_templates.bulkPut(templates)

        // Bulk insert
        const items = templates.map((tpl) => ({
          inspection_id: inspectionId!,
          template_id: tpl.id,
          section: tpl.section,
          element_name: tpl.element_name,
          sort_order: tpl.sort_order,
          field_type: tpl.field_type || 'text_photos',
          state: null,
          notes: null,
          photo_refs: [],
        }))

        const { data: created, error: createErr } = await supabase
          .from('checklist_items')
          .insert(items)
          .select()

        if (createErr) throw createErr

        // Write-through
        if (created) {
          await db.checklist_items.bulkPut(
            created.map((r) => ({ ...r, _sync_status: 'synced' as const })),
          )
        }

        return groupBySection((created ?? []) as ChecklistItem[])
      },
      async () => {
        // Try loading existing items from local DB
        let items = await db.checklist_items
          .where('inspection_id')
          .equals(inspectionId!)
          .sortBy('sort_order')

        if (items.length > 0) {
          return groupBySection(items as unknown as ChecklistItem[])
        }

        // No items locally — try creating from cached templates
        const templates = await db.checklist_templates
          .where('inspection_type')
          .equals(inspectionType!)
          .sortBy('sort_order')

        if (templates.length === 0) return []

        const now = new Date().toISOString()
        const newItems = templates.map((tpl) => ({
          id: crypto.randomUUID(),
          inspection_id: inspectionId!,
          template_id: tpl.id,
          section: tpl.section,
          element_name: tpl.element_name,
          sort_order: tpl.sort_order,
          field_type: tpl.field_type || 'text_photos',
          status: null,
          state: null,
          state_description: null,
          notes: null,
          photo_refs: [] as string[],
          yesno_value: null,
          created_at: now,
          updated_at: now,
          _sync_status: 'synced' as const,
        }))

        await db.checklist_items.bulkPut(newItems)

        return groupBySection(newItems as unknown as ChecklistItem[])
      },
    ),
    enabled: !!inspectionId && !!inspectionType,
    staleTime: 30_000,
  })
}

// ─── Update item ─────────────────────────────────────────────────────────────

export function useUpdateChecklistItem() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, inspectionId, updates }: {
      id: string
      inspectionId: string
      updates: ChecklistItemUpdate
    }) => {
      if (!navigator.onLine) {
        return updateChecklistItemOffline(id, updates, inspectionId) as unknown as ChecklistItem
      }

      const { data, error } = await supabase
        .from('checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await db.checklist_items.put({ ...(data as Record<string, unknown>), _sync_status: 'synced' } as never)

      return data as ChecklistItem
    },
    onSuccess: (_data, { inspectionId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, inspectionId] })
    },
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupBySection(items: ChecklistItem[]): ChecklistSection[] {
  const map = new Map<string, ChecklistItem[]>()

  for (const item of items) {
    const existing = map.get(item.section)
    if (existing) {
      existing.push(item)
    } else {
      map.set(item.section, [item])
    }
  }

  return Array.from(map.entries()).map(([section, sectionItems]) => ({
    section,
    items: sectionItems,
  }))
}
