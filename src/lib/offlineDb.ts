import Dexie, { type Table } from 'dexie'
import type { Json } from '@/types/database.types'

// ─── Sync status for local records ─────────────────────────────────────────

export type SyncStatus = 'synced' | 'pending' | 'conflict'

// ─── Local record types (mirror Supabase + _sync_status) ───────────────────

export interface LocalInspection {
  id: string
  user_id: string
  client_id: string | null
  type: string
  status: string
  reference_number: string | null
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
  previous_protocol_notes: string | null
  completed_works: string | null
  tenant_complaints: string | null
  incomplete_works: string | null
  building_docs_status: string | null
  usage_docs_status: string | null
  building_log_status: string | null
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
  pg_nazwa: string | null
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
  _sync_status: SyncStatus
}

export interface LocalClient {
  id: string
  user_id: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
  _sync_status: SyncStatus
}

export interface LocalDefect {
  id: string
  inspection_id: string
  number: number
  title: string
  description: string | null
  type: string
  severity: string
  category: string | null
  status: string
  contractor: string | null
  responsible_person: string | null
  reporter_name: string | null
  deadline: string | null
  location_label: string | null
  floor_plan_id: string | null
  created_at: string
  updated_at: string
  _sync_status: SyncStatus
}

export interface LocalPhoto {
  id: string
  inspection_id: string
  defect_id: string | null
  checklist_item_id: string | null
  original_path: string
  annotated_path: string | null
  thumbnail_path: string | null
  caption: string | null
  photo_number: number
  ai_analysis: Json | null
  created_at: string
  _sync_status: SyncStatus
}

export interface LocalFloorPlan {
  id: string
  inspection_id: string
  label: string
  storage_path: string
  file_type: string
  sort_order: number
  created_at: string
  _sync_status: SyncStatus
}

export interface LocalPin {
  id: string
  floor_plan_id: string
  defect_id: string | null
  x_percent: number
  y_percent: number
  label_number: number
  created_at: string
  _sync_status: SyncStatus
}

export interface LocalChecklistItem {
  id: string
  inspection_id: string
  template_id: string | null
  section: string
  element_name: string
  status: string | null
  state: string | null
  state_description: string | null
  notes: string | null
  photo_refs: string[]
  sort_order: number
  yesno_value: boolean | null
  field_type: string
  created_at: string
  updated_at: string
  _sync_status: SyncStatus
}

export interface LocalVoiceNote {
  id: string
  inspection_id: string
  defect_id: string | null
  storage_path: string
  duration_seconds: number | null
  transcription_raw: string | null
  transcription_professional: string | null
  created_at: string
  _sync_status: SyncStatus
}

export interface LocalReport {
  id: string
  inspection_id: string
  report_number: string
  report_type: string
  pdf_path: string | null
  inspector_signature_url: string | null
  client_signature_url: string | null
  client_signed_at: string | null
  version: number
  sent_at: string | null
  recipient_email: string | null
  created_at: string
  _sync_status: SyncStatus
}

export interface LocalProfile {
  id: string
  email: string
  full_name: string
  role: string
  company_id: string | null
  company_name: string | null
  license_number: string | null
  poiib_number: string | null
  phone: string | null
  logo_url: string | null
  signature_url: string | null
  cert_urls: string[]
  subscription_plan: string
  reports_used_this_month: number
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface LocalChecklistTemplate {
  id: string
  inspection_type: string
  section: string
  element_name: string
  legal_basis: string | null
  sort_order: number
  field_type: string
}

// ─── Sync Queue ─────────────────────────────────────────────────────────────

export type EntityType =
  | 'inspection'
  | 'client'
  | 'defect'
  | 'photo'
  | 'floor_plan'
  | 'pin'
  | 'checklist_item'
  | 'voice_note'
  | 'report'

export type OperationType = 'insert' | 'update' | 'delete'
export type QueueStatus = 'pending' | 'processing' | 'failed' | 'done'

export interface SyncQueueItem {
  id?: number
  temp_id: string
  entity: EntityType
  operation: OperationType
  payload: Record<string, unknown>
  blob_keys: string[]
  depends_on: string[]
  inspection_id: string | null
  status: QueueStatus
  retry_count: number
  last_error: string | null
  created_at: string
  updated_at: string
}

// ─── File Blob ──────────────────────────────────────────────────────────────

export interface FileBlob {
  key: string
  blob: Blob
  content_type: string
  created_at: string
}

// ─── ID Remap ───────────────────────────────────────────────────────────────

export interface IdRemap {
  temp_id: string
  real_id: string
  created_at: string
}

// ─── Database Class ─────────────────────────────────────────────────────────

class InspekcjAIOfflineDB extends Dexie {
  inspections!: Table<LocalInspection, string>
  clients!: Table<LocalClient, string>
  defects!: Table<LocalDefect, string>
  photos!: Table<LocalPhoto, string>
  floor_plans!: Table<LocalFloorPlan, string>
  pins!: Table<LocalPin, string>
  checklist_items!: Table<LocalChecklistItem, string>
  voice_notes!: Table<LocalVoiceNote, string>
  reports!: Table<LocalReport, string>
  profiles!: Table<LocalProfile, string>
  checklist_templates!: Table<LocalChecklistTemplate, string>
  sync_queue!: Table<SyncQueueItem, number>
  file_blobs!: Table<FileBlob, string>
  id_remaps!: Table<IdRemap, string>

  constructor() {
    super('inspekcjai-offline')

    this.version(1).stores({
      inspections: 'id, user_id, updated_at, _sync_status',
      clients: 'id, user_id, updated_at, _sync_status',
      defects: 'id, inspection_id, number, _sync_status',
      photos: 'id, inspection_id, defect_id, photo_number, _sync_status',
      floor_plans: 'id, inspection_id, sort_order, _sync_status',
      pins: 'id, floor_plan_id, defect_id, _sync_status',
      checklist_items: 'id, inspection_id, _sync_status',
      voice_notes: 'id, inspection_id, _sync_status',
      reports: 'id, inspection_id, _sync_status',
      profiles: 'id',
      checklist_templates: 'id, inspection_type',
      sync_queue: '++id, entity, status, created_at, inspection_id',
      file_blobs: 'key',
      id_remaps: 'temp_id, real_id',
    })
  }
}

export const db = new InspekcjAIOfflineDB()

// ─── Helpers ────────────────────────────────────────────────────────────────

const TEMP_ID_PREFIX = 'temp-'

export function generateTempId(): string {
  return `${TEMP_ID_PREFIX}${crypto.randomUUID()}`
}

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}
