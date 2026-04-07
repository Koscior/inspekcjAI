import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COLORS, SEVERITY_COLORS, styles as s } from './PDFStyles'
import { PageFooter } from './PageFooter'
import type { FloorPlanWithPins, ReportData } from '@/services/reportDataService'

const fs = StyleSheet.create({
  planContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 12,
  },
  planImage: {
    width: '100%',
    objectFit: 'contain',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  pin: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  pinText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 8,
    color: COLORS.gray600,
    fontFamily: 'Roboto',
  },
})

interface FloorPlanPageProps {
  floorPlan: FloorPlanWithPins
  imageBase64: string | null
  reportTitle: string
  reportNumber: string
}

export function FloorPlanPage({ floorPlan, imageBase64, reportTitle, reportNumber }: FloorPlanPageProps) {
  if (!imageBase64) return null

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.h2}>{floorPlan.label}</Text>
      <View style={s.divider} />

      <View style={fs.planContainer}>
        <Image src={imageBase64} style={fs.planImage} />

        {/* Pins overlay — positioned by percentage */}
        {floorPlan.pins.map((pin) => {
          const severity = pin.defect?.severity || 'minor'
          const colors = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.minor
          return (
            <View
              key={pin.id}
              style={[
                fs.pin,
                {
                  backgroundColor: colors.bg,
                  left: `${Math.max(0, Math.min(97, pin.x_percent - 1.5))}%`,
                  top: `${Math.max(0, Math.min(97, pin.y_percent - 1.5))}%`,
                },
              ]}
            >
              <Text style={fs.pinText}>{pin.label_number}</Text>
            </View>
          )
        })}
      </View>

      {/* Legend */}
      <View style={fs.legend}>
        <View style={fs.legendItem}>
          <View style={[fs.legendDot, { backgroundColor: SEVERITY_COLORS.critical.bg }]} />
          <Text style={fs.legendLabel}>Krytyczna</Text>
        </View>
        <View style={fs.legendItem}>
          <View style={[fs.legendDot, { backgroundColor: SEVERITY_COLORS.serious.bg }]} />
          <Text style={fs.legendLabel}>Poważna</Text>
        </View>
        <View style={fs.legendItem}>
          <View style={[fs.legendDot, { backgroundColor: SEVERITY_COLORS.minor.bg }]} />
          <Text style={fs.legendLabel}>Drobna</Text>
        </View>
      </View>

      {/* Pin list */}
      {floorPlan.pins.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={s.label}>Lista pinezek</Text>
          {floorPlan.pins.map((pin) => (
            <Text key={pin.id} style={{ fontSize: 8, color: COLORS.gray600, marginTop: 2, fontFamily: 'Roboto' }}>
              #{pin.label_number} — {pin.defect?.title || 'Brak usterki'}
            </Text>
          ))}
        </View>
      )}

      <PageFooter reportType={reportTitle} reportNumber={reportNumber} />
    </Page>
  )
}

export function renderFloorPlanPages(data: ReportData, reportTitle: string) {
  return data.floorPlans.map((fp) => (
    <FloorPlanPage
      key={fp.id}
      floorPlan={fp}
      imageBase64={data.floorPlanImages[fp.id] || null}
      reportTitle={reportTitle}
      reportNumber={data.reportNumber}
    />
  ))
}
