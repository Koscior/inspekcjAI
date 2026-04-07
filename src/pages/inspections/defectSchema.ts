import { z } from 'zod'

export const defectSchema = z.object({
  title: z.string().min(2, 'Wymagane minimum 2 znaki'),
  description: z.string().optional(),
  type: z.enum(['usterka', 'uwaga', 'zalecenie']),
  severity: z.enum(['critical', 'serious', 'minor']),
  category: z.string().optional(),
  custom_category: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'closed']),
  contractor: z.string().optional(),
  responsible_person: z.string().optional(),
  deadline: z.string().optional(),
  location_label: z.string().optional(),
  floor_plan_id: z.string().optional(),
})

export type DefectFormData = z.infer<typeof defectSchema>
