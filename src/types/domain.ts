import type { InspectionTypeKey } from '@/config/constants'

// ─── Profile ─────────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'inspector' | 'company_admin' | 'company_inspector'
  company_id: string | null
  company_name: string | null
  license_number: string | null      // Nr uprawnień budowlanych
  poiib_number: string | null        // Nr członkowski POIIB
  phone: string | null
  logo_url: string | null
  signature_url: string | null
  cert_urls: string[]
  subscription_plan: 'free' | 'pro' | 'company'
  onboarding_complete: boolean
  reports_used_this_month: number
  reports_reset_at: string
  created_at: string
}

// ─── Client ──────────────────────────────────────────────────────────────────
export interface Client {
  id: string
  user_id: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Inspection ──────────────────────────────────────────────────────────────
export interface Inspection {
  id: string
  user_id: string
  client_id: string | null
  type: InspectionTypeKey
  status: 'draft' | 'in_progress' | 'completed' | 'sent'
  reference_number: string | null     // INS/2025/001
  title: string
  address: string
  building_type: string | null
  construction_type: string | null
  owner_name: string | null
  owner_address: string | null
  owner_phone: string | null
  owner_email: string | null
  manager_name: string | null
  investor_name: string | null
  contractor_name: string | null
  inspection_date: string | null
  next_inspection_date: string | null
  previous_protocol_notes: string | null   // Wnioski z poprzedniej kontroli
  completed_works: string | null           // Zakres wykonanych robót
  tenant_complaints: string | null         // Zgłoszenia użytkowników
  incomplete_works: string | null          // Niewykonane roboty z poprzedniego protokołu
  building_docs_status: 'complete' | 'incomplete' | 'missing' | null
  usage_docs_status: 'complete' | 'incomplete' | 'missing' | null
  building_log_status: 'maintained' | 'incomplete' | 'missing' | null
  notes: string | null
  powierzchnia_uzytkowa: number | null
  powierzchnia_zabudowy: number | null
  kubatura: number | null
  kondygnacje_podziemne: number | null
  kondygnacje_nadziemne: number | null
  cover_photo_path: string | null
  wnioski_uwagi_zalecenia: string | null
  pilnosc_1: string | null
  pilnosc_2: string | null
  pilnosc_3: string | null
  ocena_stanu_tekst: string | null
  ocena_nadaje_sie: boolean | null
  ocena_stwierdzono_uszkodzenia: boolean | null
  pg_liczba_urzadzen: string | null
  pg_rodzaje_urzadzen: string | null
  pg_material_urzadzen: string | null
  pg_nawierzchnia: string | null
  pg_nawierzchnia_pod_urzadzeniami: string | null
  pg_mocowanie_urzadzen: string | null
  pg_ogrodzenie: string | null
  pg_naslonecznienie: string | null
  created_at: string
  updated_at: string
  // Relations (loaded on demand)
  client?: Client
  defects?: Defect[]
  photos?: Photo[]
  floor_plans?: FloorPlan[]
  checklist_items?: ChecklistItem[]
  reports?: Report[]
}

// ─── Defect ───────────────────────────────────────────────────────────────────
export interface Defect {
  id: string
  inspection_id: string
  number: number                       // auto: #1, #2...
  title: string
  description: string | null
  type: 'usterka' | 'uwaga' | 'zalecenie'
  severity: 'critical' | 'serious' | 'minor'
  category: string | null
  status: 'open' | 'in_progress' | 'closed'
  contractor: string | null
  responsible_person: string | null
  reporter_name: string | null
  deadline: string | null
  location_label: string | null        // Piętro / pomieszczenie
  floor_plan_id: string | null
  created_at: string
  updated_at: string
  // Relations
  photos?: Photo[]
  pins?: Pin[]
}

// ─── Photo ────────────────────────────────────────────────────────────────────
export interface Photo {
  id: string
  inspection_id: string
  defect_id: string | null
  checklist_item_id: string | null
  original_path: string
  annotated_path: string | null
  thumbnail_path: string | null
  caption: string | null
  photo_number: number                 // Fot. N
  ai_analysis: PhotoAiAnalysis | null
  created_at: string
}

export interface PhotoAiAnalysis {
  defects_detected: Array<{
    title: string
    description: string
    category: string
    severity: 'critical' | 'serious' | 'minor'
  }>
  analyzed_at: string
}

// ─── FloorPlan ────────────────────────────────────────────────────────────────
export interface FloorPlan {
  id: string
  inspection_id: string
  label: string                        // np. "Parter", "Piętro 1"
  storage_path: string
  file_type: 'image' | 'pdf'
  sort_order: number
  created_at: string
  // Relations
  pins?: Pin[]
}

// ─── Pin ──────────────────────────────────────────────────────────────────────
export interface Pin {
  id: string
  floor_plan_id: string
  defect_id: string | null
  x_percent: number                    // 0-100
  y_percent: number                    // 0-100
  label_number: number
  created_at: string
}

// ─── ChecklistTemplate ────────────────────────────────────────────────────────
export interface ChecklistTemplate {
  id: string
  inspection_type: InspectionTypeKey
  section: string                      // np. "PODSTAWOWE ELEMENTY"
  element_name: string                 // np. "ściany nośne"
  legal_basis: string | null           // Art. 62 pkt 1...
  sort_order: number
  field_type: 'text_photos' | 'yesno_desc_photos' | 'yesno'
}

// ─── ChecklistItem ────────────────────────────────────────────────────────────
export interface ChecklistItem {
  id: string
  inspection_id: string
  template_id: string
  section: string
  element_name: string
  status: 'ok' | 'nok' | 'nie_dotyczy' | null
  state: 'dobry' | 'sredni' | 'dostateczny' | 'nie_dotyczy' | null
  state_description: string | null
  notes: string | null
  photo_refs: string[]                 // photo ids
  sort_order: number
  yesno_value: boolean | null
  field_type: 'text_photos' | 'yesno_desc_photos' | 'yesno'
  // Relations
  template?: ChecklistTemplate
}

// ─── VoiceNote ────────────────────────────────────────────────────────────────
export interface VoiceNote {
  id: string
  inspection_id: string
  defect_id: string | null
  storage_path: string
  duration_seconds: number | null
  transcription_raw: string | null
  transcription_professional: string | null
  created_at: string
}

// ─── Report ───────────────────────────────────────────────────────────────────
export interface Report {
  id: string
  inspection_id: string
  report_number: string                // INS/2025/001
  report_type: 'techniczny' | 'zadania' | 'protokol'
  pdf_path: string | null
  inspector_signature_url: string | null
  client_signature_url: string | null
  client_signed_at: string | null
  version: number
  sent_at: string | null
  recipient_email: string | null
  created_at: string
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string
  name: 'free' | 'pro' | 'company'
  label: string
  price_pln: number
  report_limit: number | null         // null = unlimited
  inspector_limit: number | null      // null = unlimited
  stripe_price_id: string | null
  features: string[]
}
