import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COLORS, styles as s } from './PDFStyles'
import { PageFooter } from './PageFooter'
import type { ReportData } from '@/services/reportDataService'
import { format } from 'date-fns'
import { pl as plLocale } from 'date-fns/locale'

const cs = StyleSheet.create({
  page: {
    ...s.page,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    maxWidth: 180,
    maxHeight: 60,
    marginBottom: 24,
    objectFit: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Roboto',
  },
  // ─── Table ─────────────────────────────────────────────
  table: {
    width: '80%',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableLabel: {
    width: '40%',
    padding: 8,
    paddingVertical: 7,
    backgroundColor: COLORS.gray100,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gray600,
    fontFamily: 'Roboto',
    textTransform: 'uppercase',
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
  },
  tableValue: {
    flex: 1,
    padding: 8,
    paddingVertical: 7,
    fontSize: 10,
    color: COLORS.gray900,
    fontFamily: 'Roboto',
  },
  // ─── Cover photo ───────────────────────────────────────
  coverPhoto: {
    width: '80%',
    maxHeight: 250,
    objectFit: 'cover' as const,
    borderRadius: 4,
    marginBottom: 20,
  },
  // ─── Badge ─────────────────────────────────────────────
  countBadge: {
    marginTop: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
})

interface CoverPageProps {
  data: ReportData
  reportTitle: string
  extended?: boolean  // for task report — show extra fields
}

export function CoverPage({ data, reportTitle, extended }: CoverPageProps) {
  const { inspection, client, profile, totalDefects, reportNumber, generatedAt } = data

  const dateStr = inspection.inspection_date
    ? format(new Date(inspection.inspection_date), 'dd.MM.yyyy', { locale: plLocale })
    : format(generatedAt, 'dd.MM.yyyy', { locale: plLocale })

  // Build rows for the table
  const rows: Array<{ label: string; value: string; isLast?: boolean }> = []

  rows.push({ label: 'Projekt', value: inspection.title })
  rows.push({ label: 'Adres', value: inspection.address })

  if (extended && inspection.reference_number) {
    rows.push({ label: 'Nr referencyjny', value: inspection.reference_number })
  }

  if (client) {
    rows.push({ label: 'Klient', value: client.full_name })
  }

  if (extended && inspection.investor_name) {
    rows.push({ label: 'Inwestor', value: inspection.investor_name })
  }
  if (extended && inspection.contractor_name) {
    rows.push({ label: 'Gen. wykonawca', value: inspection.contractor_name })
  }

  rows.push({ label: 'Data', value: dateStr })
  rows.push({ label: 'Utworzył', value: profile.full_name })

  if (profile.email) {
    rows.push({ label: 'E-mail', value: profile.email })
  }
  if (profile.phone) {
    rows.push({ label: 'Telefon', value: profile.phone as string })
  }
  if (profile.company_name) {
    rows.push({ label: 'Firma', value: profile.company_name as string })
  }

  if (extended && inspection.inspection_date) {
    rows.push({ label: 'Data rozpoczęcia', value: format(new Date(inspection.inspection_date), 'dd.MM.yyyy') })
  }

  // Mark last row
  if (rows.length > 0) {
    rows[rows.length - 1].isLast = true
  }

  return (
    <Page size="A4" style={cs.page}>
      {/* Logo */}
      {profile.logo_url && (
        <Image src={profile.logo_url} style={cs.logo} />
      )}

      {/* Title */}
      <Text style={cs.title}>{reportTitle}</Text>

      {/* Cover photo */}
      {data.coverPhotoBase64 && (
        <Image src={data.coverPhotoBase64} style={cs.coverPhoto} />
      )}

      {/* Info table */}
      <View style={cs.table}>
        {rows.map((row, i) => (
          <View key={i} style={row.isLast ? cs.tableRowLast : cs.tableRow}>
            <Text style={cs.tableLabel}>{row.label}</Text>
            <Text style={cs.tableValue}>{row.value || '—'}</Text>
          </View>
        ))}
      </View>

      {/* Defect count badge */}
      <View style={cs.countBadge}>
        <Text style={cs.countText}>ZGŁOSZEŃ: {totalDefects}</Text>
      </View>

      <PageFooter reportType={reportTitle} reportNumber={reportNumber} />
    </Page>
  )
}
