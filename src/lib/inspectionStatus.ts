import { supabase } from '@/config/supabase'

const STATUS_ORDER = ['draft', 'in_progress', 'completed', 'sent'] as const

/**
 * Promotes inspection status forward (never downgrades).
 * draft → in_progress → completed → sent
 */
export async function promoteInspectionStatus(
  inspectionId: string,
  targetStatus: typeof STATUS_ORDER[number],
) {
  // Fetch current status
  const { data } = await supabase
    .from('inspections')
    .select('status')
    .eq('id', inspectionId)
    .single()

  if (!data) return

  const currentIndex = STATUS_ORDER.indexOf(data.status as typeof STATUS_ORDER[number])
  const targetIndex = STATUS_ORDER.indexOf(targetStatus)

  // Only promote forward
  if (targetIndex <= currentIndex) return

  await supabase
    .from('inspections')
    .update({ status: targetStatus })
    .eq('id', inspectionId)
}
