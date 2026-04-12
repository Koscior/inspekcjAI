import { db, generateTempId, isTempId } from './offlineDb'
import { enqueueMutation } from './syncQueue'
import { storeBlob } from './offlineStorage'
import { compressImage } from './imageUtils'
import type {
  InspectionInsert,
  InspectionUpdate,
  DefectInsert,
  DefectUpdate,
  PhotoInsert,
  FloorPlanInsert,
  PinInsert,
  PinUpdate,
  ClientInsert,
  ClientUpdate,
  ChecklistItemUpdate,
} from '@/types/database.types'

// ─── Inspections ────────────────────────────────────────────────────────────

export async function createInspectionOffline(
  input: Omit<InspectionInsert, 'user_id'>,
  userId: string,
) {
  const tempId = generateTempId()
  const now = new Date().toISOString()
  const record = {
    id: tempId,
    ...input,
    user_id: userId,
    status: input.status ?? 'draft',
    address: input.address ?? '',
    created_at: now,
    updated_at: now,
    _sync_status: 'pending' as const,
    // Ensure all nullable fields have a value
    client_id: input.client_id ?? null,
    reference_number: input.reference_number ?? null,
    building_type: input.building_type ?? null,
    construction_type: input.construction_type ?? null,
    owner_name: input.owner_name ?? null,
    owner_address: input.owner_address ?? null,
    owner_phone: input.owner_phone ?? null,
    owner_email: input.owner_email ?? null,
    manager_name: input.manager_name ?? null,
    investor_name: input.investor_name ?? null,
    contractor_name: input.contractor_name ?? null,
    inspection_date: input.inspection_date ?? null,
    next_inspection_date: input.next_inspection_date ?? null,
    previous_protocol_notes: input.previous_protocol_notes ?? null,
    completed_works: input.completed_works ?? null,
    tenant_complaints: input.tenant_complaints ?? null,
    incomplete_works: input.incomplete_works ?? null,
    building_docs_status: input.building_docs_status ?? null,
    usage_docs_status: input.usage_docs_status ?? null,
    building_log_status: input.building_log_status ?? null,
    notes: input.notes ?? null,
    powierzchnia_uzytkowa: input.powierzchnia_uzytkowa ?? null,
    powierzchnia_zabudowy: input.powierzchnia_zabudowy ?? null,
    kubatura: input.kubatura ?? null,
    kondygnacje_podziemne: input.kondygnacje_podziemne ?? null,
    kondygnacje_nadziemne: input.kondygnacje_nadziemne ?? null,
    cover_photo_path: input.cover_photo_path ?? null,
    wnioski_uwagi_zalecenia: input.wnioski_uwagi_zalecenia ?? null,
    pilnosc_1: input.pilnosc_1 ?? null,
    pilnosc_2: input.pilnosc_2 ?? null,
    pilnosc_3: input.pilnosc_3 ?? null,
    ocena_stanu_tekst: input.ocena_stanu_tekst ?? null,
    ocena_nadaje_sie: input.ocena_nadaje_sie ?? null,
    ocena_stwierdzono_uszkodzenia: input.ocena_stwierdzono_uszkodzenia ?? null,
    pg_nazwa: input.pg_nazwa ?? null,
    pg_liczba_urzadzen: input.pg_liczba_urzadzen ?? null,
    pg_rodzaje_urzadzen: input.pg_rodzaje_urzadzen ?? null,
    pg_material_urzadzen: input.pg_material_urzadzen ?? null,
    pg_nawierzchnia: input.pg_nawierzchnia ?? null,
    pg_nawierzchnia_pod_urzadzeniami: input.pg_nawierzchnia_pod_urzadzeniami ?? null,
    pg_mocowanie_urzadzen: input.pg_mocowanie_urzadzen ?? null,
    pg_ogrodzenie: input.pg_ogrodzenie ?? null,
    pg_naslonecznienie: input.pg_naslonecznienie ?? null,
  }

  await db.inspections.put(record)
  await enqueueMutation({
    temp_id: tempId,
    entity: 'inspection',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
    inspection_id: tempId,
  })

  return record
}

export async function updateInspectionOffline(
  id: string,
  updates: InspectionUpdate,
) {
  const now = new Date().toISOString()
  await db.inspections.update(id, {
    ...updates,
    updated_at: now,
    _sync_status: 'pending',
  } as Partial<typeof updates & { updated_at: string; _sync_status: string }>)

  const record = await db.inspections.get(id)
  if (!record) throw new Error('Inspekcja nie znaleziona w lokalnej bazie')

  await enqueueMutation({
    temp_id: id,
    entity: 'inspection',
    operation: 'update',
    payload: record as unknown as Record<string, unknown>,
    inspection_id: id,
  })

  return record
}

export async function deleteInspectionOffline(id: string) {
  await db.inspections.delete(id)
  await enqueueMutation({
    temp_id: id,
    entity: 'inspection',
    operation: 'delete',
    payload: { id },
    inspection_id: id,
  })
}

// ─── Defects ────────────────────────────────────────────────────────────────

export async function createDefectOffline(
  input: Omit<DefectInsert, 'number'>,
  inspectionId: string,
) {
  const tempId = generateTempId()
  const now = new Date().toISOString()

  // Get next number from local DB
  const existing = await db.defects
    .where('inspection_id')
    .equals(inspectionId)
    .sortBy('number')
  const number = (existing.at(-1)?.number ?? 0) + 1

  const record = {
    id: tempId,
    ...input,
    inspection_id: inspectionId,
    number,
    title: input.title,
    description: input.description ?? null,
    type: input.type ?? 'usterka',
    severity: input.severity ?? 'minor',
    category: input.category ?? null,
    status: input.status ?? 'open',
    contractor: input.contractor ?? null,
    responsible_person: input.responsible_person ?? null,
    reporter_name: input.reporter_name ?? null,
    deadline: input.deadline ?? null,
    location_label: input.location_label ?? null,
    floor_plan_id: input.floor_plan_id ?? null,
    created_at: now,
    updated_at: now,
    _sync_status: 'pending' as const,
  }

  await db.defects.put(record)

  const dependsOn: string[] = []
  if (isTempId(inspectionId)) dependsOn.push(inspectionId)

  await enqueueMutation({
    temp_id: tempId,
    entity: 'defect',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
    depends_on: dependsOn,
    inspection_id: inspectionId,
  })

  // Promote inspection status locally
  await promoteInspectionStatusOffline(inspectionId, 'in_progress')

  return record
}

export async function updateDefectOffline(id: string, updates: DefectUpdate, inspectionId: string) {
  const now = new Date().toISOString()
  await db.defects.update(id, { ...updates, updated_at: now, _sync_status: 'pending' })

  const record = await db.defects.get(id)
  if (!record) throw new Error('Usterka nie znaleziona w lokalnej bazie')

  await enqueueMutation({
    temp_id: id,
    entity: 'defect',
    operation: 'update',
    payload: record as unknown as Record<string, unknown>,
    inspection_id: inspectionId,
  })

  return record
}

export async function deleteDefectOffline(id: string, inspectionId: string) {
  await db.defects.delete(id)
  await enqueueMutation({
    temp_id: id,
    entity: 'defect',
    operation: 'delete',
    payload: { id },
    inspection_id: inspectionId,
  })
}

// ─── Photos ─────────────────────────────────────────────────────────────────

export async function uploadPhotoOffline(
  input: {
    inspectionId: string
    file: File
    defectId?: string
    checklistItemId?: string
    caption?: string
  },
  userId: string,
) {
  const tempId = generateTempId()
  const fileId = crypto.randomUUID()
  const basePath = `${userId}/${input.inspectionId}`
  const originalPath = `${basePath}/${fileId}.webp`
  const thumbnailPath = `${basePath}/thumbs/${fileId}.webp`
  const now = new Date().toISOString()

  // Compress and generate thumbnail
  const compressed = await compressImage(input.file, 2048)
  const thumbnail = await compressImage(input.file, 300)

  // Store blobs locally
  await storeBlob(originalPath, compressed, 'image/webp')
  await storeBlob(thumbnailPath, thumbnail, 'image/webp')

  // Get next photo_number from local DB
  const existing = await db.photos
    .where('inspection_id')
    .equals(input.inspectionId)
    .sortBy('photo_number')
  const photoNumber = (existing.at(-1)?.photo_number ?? 0) + 1

  const record = {
    id: tempId,
    inspection_id: input.inspectionId,
    original_path: originalPath,
    thumbnail_path: thumbnailPath,
    annotated_path: null,
    photo_number: photoNumber,
    defect_id: input.defectId ?? null,
    checklist_item_id: input.checklistItemId ?? null,
    caption: input.caption ?? null,
    ai_analysis: null,
    created_at: now,
    _sync_status: 'pending' as const,
  }

  await db.photos.put(record)

  const dependsOn: string[] = []
  if (isTempId(input.inspectionId)) dependsOn.push(input.inspectionId)
  if (input.defectId && isTempId(input.defectId)) dependsOn.push(input.defectId)

  await enqueueMutation({
    temp_id: tempId,
    entity: 'photo',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
    blob_keys: [originalPath, thumbnailPath],
    depends_on: dependsOn,
    inspection_id: input.inspectionId,
  })

  // Promote inspection status locally
  await promoteInspectionStatusOffline(input.inspectionId, 'in_progress')

  return record
}

export async function updatePhotoOffline(
  id: string,
  inspectionId: string,
  updates: Record<string, unknown>,
) {
  await db.photos.update(id, { ...updates, _sync_status: 'pending' })

  const record = await db.photos.get(id)
  if (!record) throw new Error('Zdjęcie nie znalezione w lokalnej bazie')

  await enqueueMutation({
    temp_id: id,
    entity: 'photo',
    operation: 'update',
    payload: record as unknown as Record<string, unknown>,
    inspection_id: inspectionId,
  })

  return record
}

export async function deletePhotoOffline(
  id: string,
  inspectionId: string,
  originalPath: string,
  thumbnailPath?: string | null,
  annotatedPath?: string | null,
) {
  await db.photos.delete(id)

  // Clean up local blobs
  const { deleteBlob: del } = await import('./offlineStorage')
  await del(originalPath)
  if (thumbnailPath) await del(thumbnailPath)
  if (annotatedPath) await del(annotatedPath)

  await enqueueMutation({
    temp_id: id,
    entity: 'photo',
    operation: 'delete',
    payload: { id },
    inspection_id: inspectionId,
  })
}

// ─── Floor Plans ────────────────────────────────────────────────────────────

export async function uploadFloorPlanOffline(
  input: {
    inspectionId: string
    file: File
    label: string
  },
  userId: string,
) {
  const tempId = generateTempId()
  const fileId = crypto.randomUUID()
  const ext = input.file.name.split('.').pop() ?? 'jpg'
  const storagePath = `${userId}/${input.inspectionId}/${fileId}.${ext}`
  const now = new Date().toISOString()

  // Store blob locally
  await storeBlob(storagePath, input.file, input.file.type)

  // Get next sort_order
  const existing = await db.floor_plans
    .where('inspection_id')
    .equals(input.inspectionId)
    .sortBy('sort_order')
  const sortOrder = (existing.at(-1)?.sort_order ?? 0) + 1

  const record = {
    id: tempId,
    inspection_id: input.inspectionId,
    label: input.label,
    storage_path: storagePath,
    file_type: 'image' as const,
    sort_order: sortOrder,
    created_at: now,
    _sync_status: 'pending' as const,
  }

  await db.floor_plans.put(record)

  const dependsOn: string[] = []
  if (isTempId(input.inspectionId)) dependsOn.push(input.inspectionId)

  await enqueueMutation({
    temp_id: tempId,
    entity: 'floor_plan',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
    blob_keys: [storagePath],
    depends_on: dependsOn,
    inspection_id: input.inspectionId,
  })

  return record
}

// ─── Pins ───────────────────────────────────────────────────────────────────

export async function createPinOffline(input: PinInsert, inspectionId: string) {
  const tempId = generateTempId()
  const now = new Date().toISOString()

  const record = {
    id: tempId,
    floor_plan_id: input.floor_plan_id,
    defect_id: input.defect_id ?? null,
    x_percent: input.x_percent,
    y_percent: input.y_percent,
    label_number: input.label_number,
    created_at: now,
    _sync_status: 'pending' as const,
  }

  await db.pins.put(record)

  const dependsOn: string[] = []
  if (isTempId(input.floor_plan_id)) dependsOn.push(input.floor_plan_id)
  if (input.defect_id && isTempId(input.defect_id)) dependsOn.push(input.defect_id)

  await enqueueMutation({
    temp_id: tempId,
    entity: 'pin',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
    depends_on: dependsOn,
    inspection_id: inspectionId,
  })

  return record
}

export async function updatePinOffline(id: string, updates: PinUpdate, inspectionId: string) {
  await db.pins.update(id, { ...updates, _sync_status: 'pending' })

  const record = await db.pins.get(id)
  if (!record) throw new Error('Pin nie znaleziony w lokalnej bazie')

  await enqueueMutation({
    temp_id: id,
    entity: 'pin',
    operation: 'update',
    payload: record as unknown as Record<string, unknown>,
    inspection_id: inspectionId,
  })

  return record
}

export async function deletePinOffline(id: string, inspectionId: string) {
  await db.pins.delete(id)
  await enqueueMutation({
    temp_id: id,
    entity: 'pin',
    operation: 'delete',
    payload: { id },
    inspection_id: inspectionId,
  })
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function createClientOffline(input: ClientInsert) {
  const tempId = generateTempId()
  const now = new Date().toISOString()

  const record = {
    id: tempId,
    user_id: input.user_id,
    full_name: input.full_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
    _sync_status: 'pending' as const,
  }

  await db.clients.put(record)

  await enqueueMutation({
    temp_id: tempId,
    entity: 'client',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
  })

  return record
}

export async function updateClientOffline(id: string, updates: ClientUpdate) {
  const now = new Date().toISOString()
  await db.clients.update(id, { ...updates, updated_at: now, _sync_status: 'pending' })

  const record = await db.clients.get(id)
  if (!record) throw new Error('Klient nie znaleziony w lokalnej bazie')

  await enqueueMutation({
    temp_id: id,
    entity: 'client',
    operation: 'update',
    payload: record as unknown as Record<string, unknown>,
  })

  return record
}

export async function deleteClientOffline(id: string) {
  await db.clients.delete(id)
  await enqueueMutation({
    temp_id: id,
    entity: 'client',
    operation: 'delete',
    payload: { id },
  })
}

// ─── Checklist Items ────────────────────────────────────────────────────────

export async function updateChecklistItemOffline(
  id: string,
  updates: ChecklistItemUpdate,
  inspectionId: string,
) {
  const now = new Date().toISOString()
  await db.checklist_items.update(id, { ...updates, updated_at: now, _sync_status: 'pending' })

  const record = await db.checklist_items.get(id)
  if (!record) throw new Error('Element checklisty nie znaleziony w lokalnej bazie')

  await enqueueMutation({
    temp_id: id,
    entity: 'checklist_item',
    operation: 'update',
    payload: record as unknown as Record<string, unknown>,
    inspection_id: inspectionId,
  })

  return record
}

// ─── Voice Notes ────────────────────────────────────────────────────────────

export async function createVoiceNoteOffline(
  input: {
    inspectionId: string
    defectId?: string
    audioBlob: Blob
    durationSeconds: number
  },
  userId: string,
) {
  const tempId = generateTempId()
  const fileId = crypto.randomUUID()
  const storagePath = `${userId}/${input.inspectionId}/${fileId}.webm`
  const now = new Date().toISOString()

  // Store audio blob locally
  await storeBlob(storagePath, input.audioBlob, 'audio/webm')

  const record = {
    id: tempId,
    inspection_id: input.inspectionId,
    defect_id: input.defectId ?? null,
    storage_path: storagePath,
    duration_seconds: input.durationSeconds,
    transcription_raw: null,
    transcription_professional: null,
    created_at: now,
    _sync_status: 'pending' as const,
  }

  await db.voice_notes.put(record)

  const dependsOn: string[] = []
  if (isTempId(input.inspectionId)) dependsOn.push(input.inspectionId)

  await enqueueMutation({
    temp_id: tempId,
    entity: 'voice_note',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
    blob_keys: [storagePath],
    depends_on: dependsOn,
    inspection_id: input.inspectionId,
  })

  return record
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function saveReportOffline(
  input: {
    inspectionId: string
    reportNumber: string
    reportType: string
    pdfBlob: Blob
    version: number
    inspectorSignatureUrl?: string | null
    clientSignatureUrl?: string | null
  },
  userId: string,
) {
  const tempId = generateTempId()
  const timestamp = Date.now()
  const pdfPath = `${userId}/${input.inspectionId}/${input.reportType}_${timestamp}.pdf`
  const now = new Date().toISOString()

  // Store PDF blob locally
  await storeBlob(pdfPath, input.pdfBlob, 'application/pdf')

  const record = {
    id: tempId,
    inspection_id: input.inspectionId,
    report_number: input.reportNumber,
    report_type: input.reportType,
    pdf_path: pdfPath,
    inspector_signature_url: input.inspectorSignatureUrl ?? null,
    client_signature_url: input.clientSignatureUrl ?? null,
    client_signed_at: null,
    version: input.version,
    sent_at: null,
    recipient_email: null,
    created_at: now,
    _sync_status: 'pending' as const,
  }

  await db.reports.put(record)

  const dependsOn: string[] = []
  if (isTempId(input.inspectionId)) dependsOn.push(input.inspectionId)

  await enqueueMutation({
    temp_id: tempId,
    entity: 'report',
    operation: 'insert',
    payload: record as unknown as Record<string, unknown>,
    blob_keys: [pdfPath],
    depends_on: dependsOn,
    inspection_id: input.inspectionId,
  })

  // Promote inspection status locally
  await promoteInspectionStatusOffline(input.inspectionId, 'completed')

  return record
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_ORDER = ['draft', 'in_progress', 'completed', 'sent'] as const

async function promoteInspectionStatusOffline(
  inspectionId: string,
  targetStatus: typeof STATUS_ORDER[number],
) {
  const inspection = await db.inspections.get(inspectionId)
  if (!inspection) return

  const currentIndex = STATUS_ORDER.indexOf(inspection.status as typeof STATUS_ORDER[number])
  const targetIndex = STATUS_ORDER.indexOf(targetStatus)

  if (targetIndex <= currentIndex) return

  await db.inspections.update(inspectionId, {
    status: targetStatus,
    _sync_status: 'pending',
  })
}
