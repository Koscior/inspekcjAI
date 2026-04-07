import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
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
    queryFn: async () => {
      // Check if items already exist
      const { data: existing, error: existErr } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('inspection_id', inspectionId!)
        .order('sort_order', { ascending: true })

      if (existErr) throw existErr

      // If items exist, return them grouped
      if (existing && existing.length > 0) {
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
      return groupBySection((created ?? []) as ChecklistItem[])
    },
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
      const { data, error } = await supabase
        .from('checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
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
