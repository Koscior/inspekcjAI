import { z } from 'zod'

export const clientSchema = z.object({
  full_name:  z.string().min(2, 'Wymagane minimum 2 znaki'),
  email:      z.string().email('Nieprawidłowy adres email').or(z.literal('')).optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  notes:      z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>
