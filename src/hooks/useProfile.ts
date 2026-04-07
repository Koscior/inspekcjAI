import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { STORAGE_BUCKETS } from '@/config/constants'
import type { Profile } from '@/types/domain'

const QUERY_KEY = 'profile'

// ─── Load Profile ────────────────────────────────────────────────────────────

export function useProfile() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error) throw error
      return data as unknown as Profile
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

// ─── Update Profile ──────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Nie zalogowano')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Profile
    },
    onSuccess: (data) => {
      // Update auth store so the whole app reflects changes immediately
      setProfile(data)
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

// ─── Upload Logo ─────────────────────────────────────────────────────────────

export function useUploadLogo() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)
  const profile = useAuthStore((s) => s.profile)

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Nie zalogowano')

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const storagePath = `${user.id}/logo.${ext}`

      // Delete old logo if exists
      if (profile?.logo_url) {
        const oldPath = extractStoragePath(profile.logo_url, STORAGE_BUCKETS.branding)
        if (oldPath) {
          await supabase.storage.from(STORAGE_BUCKETS.branding).remove([oldPath])
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.branding)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        })
      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.branding)
        .getPublicUrl(storagePath)

      // Add cache buster to force re-render
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update({ logo_url: logoUrl })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Profile
    },
    onSuccess: (data) => {
      setProfile(data)
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

// ─── Delete Logo ─────────────────────────────────────────────────────────────

export function useDeleteLogo() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)
  const profile = useAuthStore((s) => s.profile)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Nie zalogowano')

      // Delete from storage
      if (profile?.logo_url) {
        const oldPath = extractStoragePath(profile.logo_url, STORAGE_BUCKETS.branding)
        if (oldPath) {
          await supabase.storage.from(STORAGE_BUCKETS.branding).remove([oldPath])
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update({ logo_url: null })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Profile
    },
    onSuccess: (data) => {
      setProfile(data)
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

// ─── Upload Signature ────────────────────────────────────────────────────────

export function useUploadSignature() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)

  return useMutation({
    mutationFn: async (blob: Blob) => {
      if (!user) throw new Error('Nie zalogowano')

      const storagePath = `${user.id}/signature.png`

      // Upload (overwrite existing)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.branding)
        .upload(storagePath, blob, {
          contentType: 'image/png',
          upsert: true,
        })
      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.branding)
        .getPublicUrl(storagePath)

      const signatureUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update({ signature_url: signatureUrl })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Profile
    },
    onSuccess: (data) => {
      setProfile(data)
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

// ─── Delete Signature ────────────────────────────────────────────────────────

export function useDeleteSignature() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Nie zalogowano')

      const storagePath = `${user.id}/signature.png`
      await supabase.storage.from(STORAGE_BUCKETS.branding).remove([storagePath])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update({ signature_url: null })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Profile
    },
    onSuccess: (data) => {
      setProfile(data)
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract storage path from a full public URL */
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    let path = publicUrl.slice(idx + marker.length)
    // Remove query params (cache busters)
    const qIdx = path.indexOf('?')
    if (qIdx > -1) path = path.slice(0, qIdx)
    return path
  } catch {
    return null
  }
}
