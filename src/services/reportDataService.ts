import { supabase } from '@/config/supabase'
import { STORAGE_BUCKETS } from '@/config/constants'
import type { Inspection, Defect, Photo, FloorPlan, Pin, ChecklistItem } from '@/types/database.types'
import type { Profile, Client } from '@/types/domain'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DefectWithPhotos extends Defect {
  photos: Photo[]
  pins: Pin[]
}

export interface FloorPlanWithPins extends FloorPlan {
  pins: (Pin & { defect?: Defect | null })[]
}

export interface ChecklistSection {
  section: string
  items: ChecklistItem[]
}

export interface ReportData {
  inspection: Inspection & { client?: Client | null }
  client: Client | null
  profile: Profile

  defectsByCategory: Record<string, DefectWithPhotos[]>
  defectsList: DefectWithPhotos[]
  totalDefects: number

  floorPlans: FloorPlanWithPins[]
  floorPlanImages: Record<string, string>  // id → base64

  allPhotos: Photo[]
  photoImages: Record<string, string>      // id → base64
  photoNumberMap: Record<string, number>   // photoId → PDF sequential number

  checklistSections: ChecklistSection[]

  coverPhotoBase64: string | null

  inspectorSignatureBase64: string | null
  clientSignatureUrl: string | null

  reportNumber: string
  generatedAt: Date
}

export type ProgressCallback = (step: string, current: number, total: number) => void

// ─── Main ────────────────────────────────────────────────────────────────────

export async function collectReportData(
  inspectionId: string,
  userId: string,
  reportType: 'techniczny' | 'zadania' | 'protokol',
  onProgress?: ProgressCallback,
): Promise<ReportData> {
  onProgress?.('Pobieranie danych inspekcji...', 0, 1)

  // 1. Fetch inspection with client
  const { data: inspection, error: inspErr } = await supabase
    .from('inspections')
    .select('*, clients(*)')
    .eq('id', inspectionId)
    .single()
  if (inspErr || !inspection) throw new Error('Nie znaleziono inspekcji')

  const client = inspection.clients as unknown as Client | null

  // 2. Fetch profile
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (profErr || !profile) throw new Error('Nie znaleziono profilu inspektora')

  // Fetch cover photo
  let coverPhotoBase64: string | null = null
  if (inspection.cover_photo_path) {
    try {
      coverPhotoBase64 = await fetchStorageAsBase64(STORAGE_BUCKETS.photos, inspection.cover_photo_path)
    } catch {
      // Skip — cover photo is optional
    }
  }

  onProgress?.('Pobieranie usterek...', 0, 1)

  // 3. Fetch defects with photos and pins
  const { data: defects } = await supabase
    .from('defects')
    .select('*, photos(*), pins(*)')
    .eq('inspection_id', inspectionId)
    .order('number', { ascending: true })

  const defectsList: DefectWithPhotos[] = (defects || []).map((d) => ({
    ...d,
    photos: (d.photos || []) as Photo[],
    pins: (d.pins || []) as Pin[],
  })) as DefectWithPhotos[]

  // Group by category
  const defectsByCategory: Record<string, DefectWithPhotos[]> = {}
  for (const d of defectsList) {
    const cat = d.category || 'Pozostałe'
    if (!defectsByCategory[cat]) defectsByCategory[cat] = []
    defectsByCategory[cat].push(d)
  }

  onProgress?.('Pobieranie planów...', 0, 1)

  // 4. Fetch floor plans with pins
  const { data: rawPlans } = await supabase
    .from('floor_plans')
    .select('*, pins(*, defects(*))')
    .eq('inspection_id', inspectionId)
    .order('sort_order', { ascending: true })

  const floorPlans: FloorPlanWithPins[] = (rawPlans || []).map((fp) => ({
    ...fp,
    pins: ((fp.pins || []) as (Pin & { defects?: Defect | null })[]).map((p) => ({
      ...p,
      defect: (p as unknown as { defects?: Defect | null }).defects ?? null,
    })),
  })) as FloorPlanWithPins[]

  // 5. Fetch ALL photos for this inspection
  const { data: allPhotosRaw } = await supabase
    .from('photos')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('photo_number', { ascending: true })
  const allPhotos = (allPhotosRaw || []) as Photo[]

  // 6. Fetch checklist (for protokol type)
  let checklistSections: ChecklistSection[] = []
  if (reportType === 'protokol') {
    onProgress?.('Pobieranie checklisty...', 0, 1)
    const { data: items } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('sort_order', { ascending: true })

    if (items && items.length > 0) {
      const grouped: Record<string, ChecklistItem[]> = {}
      for (const item of items as ChecklistItem[]) {
        if (!grouped[item.section]) grouped[item.section] = []
        grouped[item.section].push(item)
      }
      checklistSections = Object.entries(grouped).map(([section, sectionItems]) => ({
        section,
        items: sectionItems,
      }))
    }
  }

  // 6b. Build PDF photo number map (sequential numbering by checklist section order)
  let pdfPhotoCounter = 1
  const photoNumberMap: Record<string, number> = {}
  const orderedPhotos: Photo[] = []

  if (checklistSections.length > 0) {
    // First: photos linked to checklist items, in section/sort order
    for (const section of checklistSections) {
      for (const item of section.items) {
        const itemPhotos = allPhotos.filter((p) => p.checklist_item_id === item.id)
        const pdfNumbers: string[] = []
        for (const photo of itemPhotos) {
          photoNumberMap[photo.id] = pdfPhotoCounter
          pdfNumbers.push(String(pdfPhotoCounter))
          orderedPhotos.push(photo)
          pdfPhotoCounter++
        }
        ;(item as ChecklistItem).photo_refs = pdfNumbers
      }
    }
  }

  // Then: remaining photos (defect photos, general photos)
  for (const photo of allPhotos) {
    if (!photoNumberMap[photo.id]) {
      photoNumberMap[photo.id] = pdfPhotoCounter
      orderedPhotos.push(photo)
      pdfPhotoCounter++
    }
  }

  // 7. Convert photos to base64
  const photoImages: Record<string, string> = {}
  const photosToConvert = allPhotos.filter((p) => p.original_path)
  onProgress?.('Pobieranie zdjęć...', 0, photosToConvert.length)

  for (let i = 0; i < photosToConvert.length; i++) {
    const photo = photosToConvert[i]
    onProgress?.('Pobieranie zdjęć...', i + 1, photosToConvert.length)
    const storagePath = photo.annotated_path || photo.original_path
    try {
      const base64 = await fetchStorageAsBase64(STORAGE_BUCKETS.photos, storagePath)
      if (base64) photoImages[photo.id] = base64
    } catch {
      // Skip failed photos
    }
  }

  // 8. Convert floor plan images to base64
  const floorPlanImages: Record<string, string> = {}
  onProgress?.('Pobieranie planów budynku...', 0, floorPlans.length)

  for (let i = 0; i < floorPlans.length; i++) {
    const fp = floorPlans[i]
    onProgress?.('Pobieranie planów budynku...', i + 1, floorPlans.length)
    try {
      const base64 = await fetchStorageAsBase64(STORAGE_BUCKETS.floorPlans, fp.storage_path)
      if (base64) floorPlanImages[fp.id] = base64
    } catch {
      // Skip failed
    }
  }

  // 9. Fetch signatures
  onProgress?.('Pobieranie podpisów...', 0, 1)

  let inspectorSignatureBase64: string | null = null
  if (profile.signature_url) {
    try {
      inspectorSignatureBase64 = await fetchUrlAsBase64(profile.signature_url as string)
    } catch {
      // Skip
    }
  }

  // Fetch client signature from storage (uploaded via SignaturePage)
  let clientSignatureBase64: string | null = null
  try {
    const sigDir = `${userId}/${inspectionId}`
    const { data: sigFiles } = await supabase.storage
      .from(STORAGE_BUCKETS.branding)
      .list(sigDir, { search: 'client_signature' })

    if (sigFiles && sigFiles.length > 0) {
      // Pick the most recent client signature
      const latest = sigFiles.sort((a, b) => (b.name > a.name ? 1 : -1))[0]
      const sigPath = `${sigDir}/${latest.name}`
      clientSignatureBase64 = await fetchStorageAsBase64(STORAGE_BUCKETS.branding, sigPath)
    }
  } catch {
    // Skip
  }

  // Generate report number
  const reportNumber = await generateReportNumber()

  return {
    inspection: { ...inspection, client } as ReportData['inspection'],
    client,
    profile: profile as unknown as Profile,
    defectsByCategory,
    defectsList,
    totalDefects: defectsList.length,
    floorPlans,
    floorPlanImages,
    allPhotos: orderedPhotos,
    photoImages,
    photoNumberMap,
    checklistSections,
    coverPhotoBase64,
    inspectorSignatureBase64,
    clientSignatureUrl: clientSignatureBase64,
    reportNumber,
    generatedAt: new Date(),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchStorageAsBase64(bucket: string, path: string): Promise<string | null> {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  if (!data?.publicUrl) return null
  return fetchUrlAsBase64(data.publicUrl)
}

async function fetchUrlAsBase64(url: string): Promise<string | null> {
  try {
    // Strip cache busters for fetch, but keep the base URL
    const cleanUrl = url.split('?')[0]
    const resp = await fetch(cleanUrl)
    if (!resp.ok) return null
    let blob = await resp.blob()

    // @react-pdf/renderer doesn't support WebP — convert to PNG via canvas
    if (blob.type === 'image/webp') {
      blob = await convertWebpToPng(blob)
    }

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function convertWebpToPng(webpBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(webpBlob)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (pngBlob) => {
          if (pngBlob) resolve(pngBlob)
          else reject(new Error('PNG conversion failed'))
        },
        'image/png',
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load WebP image'))
    }

    img.src = url
  })
}

async function generateReportNumber(): Promise<string> {
  // Try RPC first (if migration 006 was applied)
  try {
    const { data, error } = await supabase.rpc('generate_report_number')
    if (!error && data) return data as string
  } catch {
    // Fallback
  }

  // Fallback: client-side generation
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })

  const seq = (count || 0) + 1
  return `INS/${year}/${String(seq).padStart(3, '0')}`
}
