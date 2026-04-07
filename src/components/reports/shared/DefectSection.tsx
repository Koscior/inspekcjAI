import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COLORS, SEVERITY_COLORS, styles as s } from './PDFStyles'
import type { DefectWithPhotos, FloorPlanWithPins } from '@/services/reportDataService'
import { format } from 'date-fns'

// ─── Styles ─────────────────────────────────────────────────────────────────

const ds = StyleSheet.create({
  // Card wrapper: accent bar + content
  cardOuter: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 4,
    marginBottom: 14,
    overflow: 'hidden',
  },
  accentBar: {
    width: 5,
    backgroundColor: COLORS.accent,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  defectNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginRight: 8,
    fontFamily: 'Roboto',
  },
  defectTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gray900,
    flex: 1,
    fontFamily: 'Roboto',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },

  // Info table
  infoTable: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  infoRowLast: {
    flexDirection: 'row',
  },
  infoLabel: {
    width: '35%',
    padding: 6,
    paddingVertical: 5,
    backgroundColor: COLORS.gray100,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gray600,
    fontFamily: 'Roboto',
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
  },
  infoValue: {
    flex: 1,
    padding: 6,
    paddingVertical: 5,
    fontSize: 10,
    color: COLORS.gray900,
    fontFamily: 'Roboto',
  },

  // Description
  description: {
    padding: 10,
    fontSize: 9,
    color: COLORS.gray700,
    fontFamily: 'Roboto',
    lineHeight: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  // Media grid (floor plans + photos)
  mediaRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  mediaCell: {
    flex: 1,
    alignItems: 'center',
  },
  mediaImage: {
    width: '100%',
    maxHeight: 180,
    objectFit: 'contain',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  mediaCaption: {
    fontSize: 8,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 3,
    fontFamily: 'Roboto',
  },

  // Mini floor plan
  miniPlanContainer: {
    position: 'relative',
    width: '100%',
  },
  miniPlanImage: {
    width: '100%',
    maxHeight: 180,
    objectFit: 'contain',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  miniPin: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  miniPinDimmed: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
    opacity: 0.5,
  },
  miniPinText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  miniPinTextDimmed: {
    fontSize: 5,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
})

// ─── Labels ─────────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Krytyczna',
  serious: 'Poważna',
  minor: 'Drobna',
}

const TYPE_LABELS: Record<string, string> = {
  usterka: 'Usterka',
  uwaga: 'Uwaga',
  zalecenie: 'Zalecenie',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Nowy',
  in_progress: 'W trakcie',
  closed: 'Zakończone',
}

// ─── MiniFloorPlan ──────────────────────────────────────────────────────────

interface MiniFloorPlanPin {
  x_percent: number
  y_percent: number
  label_number: number
  severity: string
  highlighted: boolean
}

interface MiniFloorPlanProps {
  imageBase64: string
  pins: MiniFloorPlanPin[]
  label: string
}

function MiniFloorPlan({ imageBase64, pins, label }: MiniFloorPlanProps) {
  return (
    <View style={ds.mediaCell}>
      <View style={ds.miniPlanContainer}>
        <Image src={imageBase64} style={ds.miniPlanImage} />
        {pins.map((pin, idx) => {
          const colors = SEVERITY_COLORS[pin.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.minor
          const isHighlighted = pin.highlighted
          return (
            <View
              key={idx}
              style={[
                isHighlighted ? ds.miniPin : ds.miniPinDimmed,
                {
                  backgroundColor: isHighlighted ? colors.bg : COLORS.gray400,
                  left: `${Math.max(0, Math.min(96, pin.x_percent - 1.5))}%`,
                  top: `${Math.max(0, Math.min(96, pin.y_percent - 1.5))}%`,
                },
              ]}
            >
              <Text style={isHighlighted ? ds.miniPinText : ds.miniPinTextDimmed}>
                {pin.label_number}
              </Text>
            </View>
          )
        })}
      </View>
      <Text style={ds.mediaCaption}>{label}</Text>
    </View>
  )
}

// ─── DefectCard ─────────────────────────────────────────────────────────────

interface DefectCardProps {
  defect: DefectWithPhotos
  photoImages: Record<string, string>
  floorPlanImages: Record<string, string>
  floorPlans: FloorPlanWithPins[]
  extended?: boolean
}

export function DefectCard({ defect, photoImages, floorPlanImages, floorPlans, extended }: DefectCardProps) {
  const sev = SEVERITY_COLORS[defect.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.minor

  // Find floor plans that have pins for this defect
  const defectFloorPlanViews = defect.pins
    .map((pin) => {
      const fp = floorPlans.find((f) => f.id === pin.floor_plan_id)
      const img = floorPlanImages[pin.floor_plan_id]
      if (!fp || !img) return null
      return { fp, img, pin }
    })
    .filter(Boolean) as Array<{ fp: FloorPlanWithPins; img: string; pin: { x_percent: number; y_percent: number; label_number: number; floor_plan_id: string } }>

  // Build single floor plan view — only this defect's pin
  let floorPlanCell: { imageBase64: string; pins: MiniFloorPlanPin[]; label: string } | null = null

  if (defectFloorPlanViews.length > 0) {
    const first = defectFloorPlanViews[0]
    floorPlanCell = {
      imageBase64: first.img,
      pins: [{
        x_percent: first.pin.x_percent,
        y_percent: first.pin.y_percent,
        label_number: first.pin.label_number,
        severity: defect.severity,
        highlighted: true,
      }],
      label: first.fp.label,
    }
  }

  // Collect all media items: floor plan first, then photos (max 4 total, 2 per row)
  const maxPhotos = floorPlanCell ? 3 : 4
  const photos = defect.photos.slice(0, maxPhotos).filter((p) => photoImages[p.id])

  // Build media items list
  type MediaItem =
    | { type: 'floorplan'; cell: NonNullable<typeof floorPlanCell> }
    | { type: 'photo'; photo: typeof photos[number] }

  const mediaItems: MediaItem[] = []
  if (floorPlanCell) mediaItems.push({ type: 'floorplan', cell: floorPlanCell })
  photos.forEach((photo) => mediaItems.push({ type: 'photo', photo }))

  // Split into rows of 2
  const mediaRows: MediaItem[][] = []
  for (let i = 0; i < mediaItems.length; i += 2) {
    mediaRows.push(mediaItems.slice(i, i + 2))
  }

  return (
    <View style={ds.cardOuter} wrap={false}>
      {/* Yellow accent bar */}
      <View style={ds.accentBar} />

      <View style={ds.cardContent}>
        {/* Header */}
        <View style={ds.header}>
          <Text style={ds.defectNumber}>#{defect.number}</Text>
          <Text style={ds.defectTitle}>{defect.title}</Text>
          <Text style={[ds.severityBadge, { backgroundColor: sev.bg, color: sev.text }]}>
            {SEVERITY_LABELS[defect.severity] || defect.severity}
          </Text>
        </View>

        {/* Info table */}
        <View style={ds.infoTable}>
          <View style={ds.infoRow}>
            <Text style={ds.infoLabel}>Kategoria</Text>
            <Text style={ds.infoValue}>{defect.category || '—'}</Text>
          </View>
          <View style={ds.infoRow}>
            <Text style={ds.infoLabel}>Typ</Text>
            <Text style={ds.infoValue}>{TYPE_LABELS[defect.type] || defect.type || '—'}</Text>
          </View>

          {extended ? (
            <>
              <View style={ds.infoRow}>
                <Text style={ds.infoLabel}>Status</Text>
                <Text style={ds.infoValue}>{STATUS_LABELS[defect.status] || defect.status || '—'}</Text>
              </View>
              <View style={ds.infoRow}>
                <Text style={ds.infoLabel}>Wykonawca</Text>
                <Text style={ds.infoValue}>{defect.contractor || '—'}</Text>
              </View>
              <View style={ds.infoRow}>
                <Text style={ds.infoLabel}>Odpowiedzialny</Text>
                <Text style={ds.infoValue}>{defect.responsible_person || '—'}</Text>
              </View>
              <View style={ds.infoRow}>
                <Text style={ds.infoLabel}>Zgłaszający</Text>
                <Text style={ds.infoValue}>{defect.reporter_name || '—'}</Text>
              </View>
              <View style={ds.infoRow}>
                <Text style={ds.infoLabel}>Utworzono</Text>
                <Text style={ds.infoValue}>
                  {format(new Date(defect.created_at), 'dd.MM.yyyy HH:mm')}
                </Text>
              </View>
              {defect.updated_at && (
                <View style={ds.infoRow}>
                  <Text style={ds.infoLabel}>Aktualizacja</Text>
                  <Text style={ds.infoValue}>
                    {format(new Date(defect.updated_at), 'dd.MM.yyyy HH:mm')}
                  </Text>
                </View>
              )}
              <View style={ds.infoRowLast}>
                <Text style={ds.infoLabel}>Data zakończenia</Text>
                <Text style={ds.infoValue}>
                  {defect.deadline ? format(new Date(defect.deadline), 'dd.MM.yyyy') : '—'}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={ds.infoRow}>
                <Text style={ds.infoLabel}>Wykonawca</Text>
                <Text style={ds.infoValue}>{defect.contractor || '—'}</Text>
              </View>
              <View style={ds.infoRowLast}>
                <Text style={ds.infoLabel}>Data zakończenia</Text>
                <Text style={ds.infoValue}>
                  {defect.deadline ? format(new Date(defect.deadline), 'dd.MM.yyyy') : '—'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Description */}
        {defect.description && (
          <Text style={ds.description}>{defect.description}</Text>
        )}

        {/* Media rows (max 2 items per row, max 2 rows = 4 items) */}
        {mediaRows.map((row, rowIdx) => (
          <View key={rowIdx} style={ds.mediaRow}>
            {row.map((item, idx) =>
              item.type === 'floorplan' ? (
                <MiniFloorPlan
                  key={`fp-${idx}`}
                  imageBase64={item.cell.imageBase64}
                  pins={item.cell.pins}
                  label={item.cell.label}
                />
              ) : (
                <View key={item.photo.id} style={ds.mediaCell}>
                  <Image src={photoImages[item.photo.id]} style={ds.mediaImage} />
                  <Text style={ds.mediaCaption}>Fot. {item.photo.photo_number}</Text>
                </View>
              ),
            )}
            {/* Spacer if only 1 item in row to keep consistent sizing */}
            {row.length === 1 && <View style={ds.mediaCell} />}
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Category section ────────────────────────────────────────────────────────

interface CategorySectionProps {
  category: string
  defects: DefectWithPhotos[]
  photoImages: Record<string, string>
  floorPlanImages: Record<string, string>
  floorPlans: FloorPlanWithPins[]
  extended?: boolean
  isFirst?: boolean
}

export function CategorySection({ category, defects, photoImages, floorPlanImages, floorPlans, extended, isFirst }: CategorySectionProps) {
  return (
    <View break={!isFirst}>
      <Text style={s.sectionHeader}>
        {category.toUpperCase()} — ZGŁOSZEŃ: {defects.length}
      </Text>
      {defects.map((d) => (
        <DefectCard
          key={d.id}
          defect={d}
          photoImages={photoImages}
          floorPlanImages={floorPlanImages}
          floorPlans={floorPlans}
          extended={extended}
        />
      ))}
    </View>
  )
}
