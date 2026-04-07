import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import '@/components/reports/fonts'
import { COLORS, styles as s } from './shared/PDFStyles'
import { PageFooter } from './shared/PageFooter'
import { SignatureSection } from './shared/SignatureSection'
import { renderPhotoDocumentation } from './shared/PhotoDocumentation'
import type { ReportData, ChecklistSection } from '@/services/reportDataService'
import { format } from 'date-fns'

const REPORT_TITLE = 'PROTOKÓŁ PRZEGLĄDU'

const ps = StyleSheet.create({
  legalHeader: {
    textAlign: 'center',
    marginBottom: 20,
  },
  protocolNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray900,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  protocolSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray700,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Roboto',
  },
  legalText: {
    fontSize: 8,
    color: COLORS.gray600,
    textAlign: 'justify',
    lineHeight: 1.5,
    marginBottom: 6,
    fontFamily: 'Roboto',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: COLORS.gray600,
    padding: 6,
    paddingHorizontal: 10,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 2,
    fontFamily: 'Roboto',
  },
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    minHeight: 22,
  },
  fieldLabel: {
    width: 160,
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.gray600,
    backgroundColor: COLORS.gray50,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    fontFamily: 'Roboto',
  },
  fieldValue: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    color: COLORS.gray900,
    fontFamily: 'Roboto',
  },
  // Checklist table
  checklistTable: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 2,
    marginBottom: 8,
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray300,
  },
  checklistRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    minHeight: 20,
  },
  checklistRowLast: {
    flexDirection: 'row',
    minHeight: 20,
  },
  cellLp: { width: 28, padding: 4, fontSize: 7, textAlign: 'center', borderRightWidth: 1, borderRightColor: COLORS.gray200, fontFamily: 'Roboto' },
  cellElement: { flex: 3, padding: 4, fontSize: 7, borderRightWidth: 1, borderRightColor: COLORS.gray200, fontFamily: 'Roboto' },
  cellState: { flex: 1.5, padding: 4, fontSize: 7, textAlign: 'center', borderRightWidth: 1, borderRightColor: COLORS.gray200, fontFamily: 'Roboto' },
  cellNotes: { flex: 3, padding: 4, fontSize: 7, borderRightWidth: 1, borderRightColor: COLORS.gray200, fontFamily: 'Roboto' },
  cellPhoto: { flex: 1, padding: 4, fontSize: 7, textAlign: 'center', fontFamily: 'Roboto' },
  headerText: { fontWeight: 'bold', color: COLORS.gray600, textTransform: 'uppercase', fontSize: 6 },
  // Docs status
  statusGood: { color: COLORS.green500, fontWeight: 'bold' },
  statusWarn: { color: COLORS.orange500, fontWeight: 'bold' },
  statusBad: { color: COLORS.red500, fontWeight: 'bold' },
  notesList: { paddingLeft: 8, marginTop: 4 },
  noteItem: { fontSize: 8, color: COLORS.gray600, marginBottom: 2, fontFamily: 'Roboto' },
  // Playground table-in-table styles
  subSectionHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: COLORS.gray600,
    padding: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray300,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  photoCaption: {
    fontSize: 8,
    fontStyle: 'italic',
    color: COLORS.gray600,
    textAlign: 'center',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    fontFamily: 'Roboto',
  },
  coverPhotoCell: {
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  ownerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  ownerLabel: {
    width: 120,
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.gray600,
    backgroundColor: COLORS.gray50,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    fontFamily: 'Roboto',
    justifyContent: 'center',
  },
  ownerSubRows: {
    flex: 1,
  },
  ownerSubRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    minHeight: 20,
  },
  ownerSubRowLast: {
    flexDirection: 'row',
    minHeight: 20,
  },
  ownerSubLabel: {
    width: 100,
    padding: 4,
    fontSize: 7,
    fontWeight: 'bold',
    color: COLORS.gray500,
    backgroundColor: COLORS.gray50,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    fontFamily: 'Roboto',
  },
  ownerSubValue: {
    flex: 1,
    padding: 4,
    fontSize: 7,
    color: COLORS.gray900,
    fontFamily: 'Roboto',
  },
})

const STATE_LABELS: Record<string, string> = {
  dobry: 'Dobry',
  sredni: 'Średni',
  dostateczny: 'Dostateczny',
  nie_dotyczy: 'N/D',
}

const DOCS_LABELS: Record<string, { label: string; style: object }> = {
  complete: { label: 'kompletna', style: ps.statusGood },
  incomplete: { label: 'niekompletna', style: ps.statusWarn },
  missing: { label: 'brak', style: ps.statusBad },
  maintained: { label: 'prowadzona', style: ps.statusGood },
}

interface ProtocolReportProps {
  data: ReportData
}

export function ProtocolReport({ data }: ProtocolReportProps) {
  const { inspection, profile, checklistSections, defectsList } = data
  const isYearly = inspection.type === 'roczny'
  const isFiveYear = inspection.type === 'piecioletni'
  const isPlayground = inspection.type === 'plac_zabaw'

  const criticalDefects = defectsList.filter((d) => d.severity === 'critical')

  const inspDate = inspection.inspection_date
    ? format(new Date(inspection.inspection_date), 'dd.MM.yyyy')
    : '—'
  const nextDate = inspection.next_inspection_date
    ? format(new Date(inspection.next_inspection_date), 'dd.MM.yyyy')
    : '—'

  const legalBasis = isYearly
    ? 'Art. 62 ust. 1 pkt 1a Ustawy z dnia 7 lipca 1994 r. Prawo budowlane (Dz.U. 2024 poz. 725)'
    : 'Art. 62 ust. 1 pkt 2 Ustawy z dnia 7 lipca 1994 r. Prawo budowlane (Dz.U. 2024 poz. 725)'

  return (
    <Document title={`${REPORT_TITLE} — ${data.inspection.title}`} author={data.profile.full_name}>
      {/* ─── Page 1: Legal header + Inspector + Building ─────────────────── */}
      <Page size="A4" style={s.page} wrap>

        {/* 1. Legal header */}
        <View style={ps.legalHeader}>
          <Text style={ps.protocolNumber}>
            PROTOKÓŁ NR {inspection.reference_number || data.reportNumber}
          </Text>
          <Text style={ps.protocolSubtitle}>
            {isPlayground
              ? 'Z OKRESOWEJ KONTROLI STANU TECHNICZNEGO PLACU ZABAW'
              : 'Z OKRESOWEJ KONTROLI STANU TECHNICZNEGO BUDYNKU'}
          </Text>
        </View>

        <Text style={ps.legalText}>
          {isPlayground
            ? 'Podstawa prawna Art. 62 ust. 1 pkt 1a ustawy z dnia 7 lipca 1994 roku – Prawo budowlane (Dz. U. z 2013 roku poz. 1409 z p. zm.)'
            : `Podstawa prawna: ${legalBasis} oraz § 4-6 Rozporządzenia Ministra Spraw Wewnętrznych i Administracji z dnia 16 sierpnia 1999 r. w sprawie warunków technicznych użytkowania budynków mieszkalnych.`
          }
        </Text>

        <Text style={ps.legalText}>
          {isPlayground ? (
            `ZAKRES KONTROLI OBEJMUJE SPRAWDZENIE:\n1) wykonania zaleceń z poprzednich kontroli okresowych,\n2) stanu technicznego placu zabaw, w tym urządzeń zabawowych`
          ) : (
            `ZAKRES KONTROLI obejmuje sprawdzenie:\n1) stanu technicznego elementów budynku, budowli i instalacji narażonych na szkodliwe wpływy atmosferyczne i niszczące działanie czynników występujących podczas użytkowania obiektu;\n2) stanu technicznego i przydatności do użytkowania obiektu budowlanego, estetyki obiektu budowlanego oraz jego otoczenia;\n${isFiveYear ? '3) instalacji elektrycznej i piorunochronnej w zakresie stanu sprawności połączeń, osprzętu, zabezpieczeń i środków ochrony od porażeń, oporności izolacji przewodów oraz uziemień instalacji i aparatów;\n' : ''}`
          )}
        </Text>

        <View style={{ flexDirection: 'row', gap: 24, marginBottom: 8 }}>
          <View>
            <Text style={s.label}>Data kontroli</Text>
            <Text style={s.body}>{inspDate}</Text>
          </View>
          <View>
            <Text style={s.label}>Data następnej kontroli</Text>
            <Text style={s.body}>{nextDate}</Text>
          </View>
        </View>

        {/* 2. Inspector */}
        <Text style={ps.sectionTitle}>OSOBA PRZEPROWADZAJĄCA KONTROLĘ</Text>
        <View style={{ borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 2 }}>
          <FieldRow label="Imię i nazwisko" value={profile.full_name} />
          <FieldRow label="Firma" value={profile.company_name as string} />
          <FieldRow label="Nr uprawnień" value={profile.license_number as string} />
          <FieldRow label="Nr POIIB" value={profile.poiib_number as string} />
          <FieldRow label="Telefon" value={profile.phone as string} />
          <FieldRow label="E-mail" value={profile.email} last />
        </View>

        {/* 3. Building / Playground info */}
        {isPlayground ? (
          <View style={{ borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 2 }}>
            {/* Main header */}
            <Text style={ps.subSectionHeader}>INFORMACJE OGÓLNE O PLACU ZABAW</Text>

            {/* Cover photo */}
            {data.coverPhotoBase64 && (
              <>
                <Text style={ps.photoCaption}>Fotografia placu zabaw (widok ogólny)</Text>
                <View style={ps.coverPhotoCell}>
                  <Image src={data.coverPhotoBase64} style={{ width: '90%', maxHeight: 220, objectFit: 'cover' }} />
                </View>
              </>
            )}

            {/* Owner/Manager — table-in-table (simulated rowSpan) */}
            <View style={ps.ownerRow}>
              <View style={ps.ownerLabel}>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: COLORS.gray600, fontFamily: 'Roboto' }}>
                  Właściciel lub{'\n'}zarządca
                </Text>
              </View>
              <View style={ps.ownerSubRows}>
                <View style={ps.ownerSubRow}>
                  <Text style={ps.ownerSubLabel}>Nazwa</Text>
                  <Text style={ps.ownerSubValue}>{inspection.owner_name || '—'}</Text>
                </View>
                <View style={ps.ownerSubRow}>
                  <Text style={ps.ownerSubLabel}>Adres</Text>
                  <Text style={ps.ownerSubValue}>{inspection.owner_address || '—'}</Text>
                </View>
                <View style={ps.ownerSubRowLast}>
                  <Text style={ps.ownerSubLabel}>Telefon kontaktowy</Text>
                  <Text style={ps.ownerSubValue}>{inspection.owner_phone || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Address & name */}
            <FieldRow label="Adres placu zabaw" value={inspection.address} />
            <FieldRow label="Nazwa placu zabaw" value={inspection.title} />

            {/* Technical characteristics sub-header */}
            <Text style={ps.subSectionHeader}>OGÓLNA CHARAKTERYSTYKA PLACU ZABAW</Text>

            <FieldRow label="Liczba urządzeń" value={inspection.pg_liczba_urzadzen} />
            <FieldRow label="Rodzaje urządzeń" value={inspection.pg_rodzaje_urzadzen} />
            <FieldRow label="Rodzaj materiałów użytych do produkcji urządzeń" value={inspection.pg_material_urzadzen} />
            <FieldRow label="Rodzaj nawierzchni" value={inspection.pg_nawierzchnia} />
            <FieldRow label="Rodzaj nawierzchni pod urządzeniami" value={inspection.pg_nawierzchnia_pod_urzadzeniami} />
            <FieldRow label="Sposób mocowania urządzeń w gruncie" value={inspection.pg_mocowanie_urzadzen} />
            <FieldRow label="Rodzaj ogrodzenia" value={inspection.pg_ogrodzenie} />
            <FieldRow label="Nasłonecznienie placu zabaw" value={inspection.pg_naslonecznienie} last />
          </View>
        ) : (
          <>
            <Text style={ps.sectionTitle}>INFORMACJE O BUDYNKU</Text>
            <View style={{ borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 2 }}>
              <FieldRow label="Rodzaj budynku" value={inspection.building_type} />
              <FieldRow label="Adres" value={inspection.address} />
              <FieldRow label="Właściciel" value={inspection.owner_name} />
              <FieldRow label="Administrator" value={inspection.manager_name} />
              <FieldRow label="Rodzaj konstrukcji" value={inspection.construction_type} last />
            </View>
          </>
        )}

        <PageFooter reportType={REPORT_TITLE} reportNumber={data.reportNumber} />
      </Page>

      {/* ─── Page 2: Previous inspection + Documentation ─────────────────── */}
      <Page size="A4" style={s.page} wrap>

        {/* 4. Previous inspection review */}
        <Text style={ps.sectionTitle}>PRZEGLĄD POPRZEDNIEJ KONTROLI</Text>
        <View style={{ borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 2 }}>
          <FieldRow label="Zalecenia z poprzedniej kontroli" value={inspection.previous_protocol_notes} />
          <FieldRow label="Zakres wykonanych robót remontowych" value={inspection.completed_works} />
          <FieldRow
            label={isPlayground ? 'Zgłoszenia użytkowników' : 'Zgłoszenia użytkowników lokali'}
            value={inspection.tenant_complaints}
          />
          <FieldRow label="Zakres niewykonanych robót" value={inspection.incomplete_works} last />
        </View>

        {/* 5. Building documentation */}
        <Text style={ps.sectionTitle}>DOKUMENTACJA BUDYNKU</Text>
        <View style={{ borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 2 }}>
          <DocStatusRow
            label="Dokumentacja budowy"
            status={inspection.building_docs_status as string}
          />
          <DocStatusRow
            label="Dokumentacja użytkowania"
            status={inspection.usage_docs_status as string}
          />
          <DocStatusRow
            label="Książka obiektu budowlanego"
            status={inspection.building_log_status as string}
            last
          />
        </View>

        <PageFooter reportType={REPORT_TITLE} reportNumber={data.reportNumber} />
      </Page>

      {/* ─── Checklist pages ─────────────────────────────────────────────── */}
      {checklistSections.length > 0 && (
        <Page size="A4" style={s.page} wrap>
          <Text style={s.h2}>
            {isPlayground ? 'Przegląd elementów placu zabaw' : 'Przegląd elementów budynku'}
          </Text>
          <View style={s.divider} />

          {checklistSections.map((section) => (
            <ChecklistTable key={section.section} section={section} />
          ))}

          {/* State legend */}
          {(() => {
            const hasStateItems = checklistSections.some((sec) =>
              sec.items.some((i) => i.field_type === 'text_photos')
            )
            const hasYesNoItems = checklistSections.some((sec) =>
              sec.items.some((i) => i.field_type === 'yesno_desc_photos' || i.field_type === 'yesno')
            )
            return (
              <View style={{ marginTop: 12, padding: 8, backgroundColor: COLORS.gray50, borderRadius: 2, flexDirection: 'row', gap: 12 }}>
                {hasStateItems && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 7, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 4, fontFamily: 'Roboto' }}>
                      KRYTERIA OCENY STANU TECHNICZNEGO:
                    </Text>
                    <Text style={{ fontSize: 7, color: COLORS.gray600, fontFamily: 'Roboto' }}>
                      Dobry — element nie wymaga napraw ani konserwacji{'\n'}
                      Średni — element wymaga drobnych napraw lub konserwacji{'\n'}
                      Dostateczny — element wymaga poważnych napraw lub wymiany{'\n'}
                      N/D — element nie dotyczy kontrolowanego obiektu
                    </Text>
                  </View>
                )}
                {hasYesNoItems && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 7, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 4, fontFamily: 'Roboto' }}>
                      OCENA ZGODNOŚCI:
                    </Text>
                    <Text style={{ fontSize: 7, color: COLORS.gray600, fontFamily: 'Roboto' }}>
                      Tak — element spełnia wymagania{'\n'}
                      Nie — element nie spełnia wymagań
                    </Text>
                  </View>
                )}
              </View>
            )
          })()}

          <PageFooter reportType={REPORT_TITLE} reportNumber={data.reportNumber} />
        </Page>
      )}

      {/* ─── Critical defects + Conclusions + Signatures ─────────────────── */}
      <Page size="A4" style={s.page} wrap>
        {/* 7. Critical defects */}
        <Text style={ps.sectionTitle}>STWIERDZONE USZKODZENIA ZAGRAŻAJĄCE ŻYCIU LUB ZDROWIU</Text>
        {criticalDefects.length > 0 ? (
          criticalDefects.map((d) => (
            <View key={d.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.red500, fontFamily: 'Roboto' }}>
                #{d.number} {d.title}
              </Text>
              {d.description && (
                <Text style={{ fontSize: 8, color: COLORS.gray600, fontFamily: 'Roboto', marginTop: 2 }}>
                  {d.description}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 8, color: COLORS.gray600, fontFamily: 'Roboto', fontStyle: 'italic' }}>
            Nie stwierdzono uszkodzeń i braków, które mogłyby zagrażać życiu lub zdrowiu ludzi, bezpieczeństwu mienia bądź środowiska.
          </Text>
        )}

        {/* 8. Conclusions */}
        <Text style={ps.sectionTitle}>WNIOSKI KOŃCOWE I ZALECENIA</Text>
        {inspection.notes ? (
          <Text style={{ fontSize: 8, color: COLORS.gray600, fontFamily: 'Roboto', lineHeight: 1.5 }}>
            {inspection.notes as string}
          </Text>
        ) : (
          <Text style={{ fontSize: 8, color: COLORS.gray500, fontFamily: 'Roboto', fontStyle: 'italic' }}>
            Stan techniczny {isPlayground ? 'placu zabaw' : 'budynku'} ocenia się jako {criticalDefects.length > 0 ? 'wymagający natychmiastowej interwencji' : 'zadowalający'}.
            {data.totalDefects > 0
              ? ` Stwierdzono łącznie ${data.totalDefects} usterek/uwag wymagających naprawy lub monitorowania.`
              : ' Nie stwierdzono usterek wymagających naprawy.'
            }
          </Text>
        )}

        {/* 9. Wnioski pokontrolne (playground only) */}
        {isPlayground && (
          <>
            <Text style={ps.sectionTitle}>WNIOSKI POKONTROLNE</Text>
            <View style={{ borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 2, marginBottom: 10 }}>
              <FieldRow label="Wnioski, opinie, uwagi, zalecenia" value={inspection.wnioski_uwagi_zalecenia} />
              <FieldRow label="I stopień pilności (natychmiast)" value={inspection.pilnosc_1} />
              <FieldRow label="II stopień pilności (do 6 miesięcy)" value={inspection.pilnosc_2} />
              <FieldRow label="III stopień pilności (bieżąca konserwacja)" value={inspection.pilnosc_3} />

              {/* Ocena końcowa sub-header */}
              <Text style={ps.subSectionHeader}>OCENA KOŃCOWA STANU TECHNICZNEGO</Text>
              <View style={{ padding: 8 }}>
                <Text style={{ fontSize: 8, color: COLORS.gray800, fontFamily: 'Roboto', lineHeight: 1.8 }}>
                  Stan techniczny obiektu oceniam jako{' '}
                  <Text style={{ fontWeight: 'bold' }}>{inspection.ocena_stanu_tekst || '.........'}</Text>.
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.gray800, fontFamily: 'Roboto', lineHeight: 1.8 }}>
                  Obiekt{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {inspection.ocena_nadaje_sie === true ? 'nadaje się' : inspection.ocena_nadaje_sie === false ? 'nie nadaje się' : '..........'}
                  </Text>
                  {' '}do dalszego użytkowania.
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.gray800, fontFamily: 'Roboto', lineHeight: 1.8 }}>
                  W trakcie kontroli{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {inspection.ocena_stwierdzono_uszkodzenia === true ? 'stwierdzono' : inspection.ocena_stwierdzono_uszkodzenia === false ? 'nie stwierdzono' : '..........'}
                  </Text>
                  {' '}uszkodzenia mogące zagrażać życiu lub zdrowiu ludzi, bezpieczeństwu mienia lub środowiska.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* 10. Signatures */}
        <SignatureSection
          inspectorName={profile.full_name}
          inspectorSignatureBase64={data.inspectorSignatureBase64}
          clientSignatureUrl={data.clientSignatureUrl}
        />

        <PageFooter reportType={REPORT_TITLE} reportNumber={data.reportNumber} />
      </Page>

      {/* ─── Photo documentation (6 per page for protocol) ───────────────── */}
      {renderPhotoDocumentation({
        photos: data.allPhotos,
        photoImages: data.photoImages,
        reportTitle: REPORT_TITLE,
        reportNumber: data.reportNumber,
        photosPerPage: 6,
        photoNumberMap: data.photoNumberMap,
      })}
    </Document>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FieldRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <View style={last ? ps.checklistRowLast : ps.fieldRow}>
      <Text style={ps.fieldLabel}>{label}</Text>
      <Text style={ps.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

function DocStatusRow({ label, status, last }: { label: string; status?: string | null; last?: boolean }) {
  const info = status ? DOCS_LABELS[status] : null
  return (
    <View style={last ? ps.checklistRowLast : ps.fieldRow}>
      <Text style={ps.fieldLabel}>{label}</Text>
      <Text style={[ps.fieldValue, info?.style || {}]}>
        {info?.label || '—'}
      </Text>
    </View>
  )
}

function ChecklistTable({ section }: { section: ChecklistSection }) {
  // Determine column type from section's field_type
  const sectionFieldType = section.items[0]?.field_type ?? 'text_photos'
  const isYesNo = sectionFieldType === 'yesno_desc_photos' || sectionFieldType === 'yesno'

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={ps.sectionTitle}>{section.section}</Text>
      <View style={ps.checklistTable}>
        {/* Header */}
        <View style={ps.checklistHeaderRow}>
          <Text style={[ps.cellLp, ps.headerText]}>Lp.</Text>
          <Text style={[ps.cellElement, ps.headerText]}>Element</Text>
          <Text style={[ps.cellState, ps.headerText]}>{isYesNo ? 'Tak/Nie' : 'Stan'}</Text>
          <Text style={[ps.cellNotes, ps.headerText]}>Uwagi</Text>
          <Text style={[ps.cellPhoto, ps.headerText]}>Fot.</Text>
        </View>

        {/* Rows */}
        {section.items.map((item, idx) => {
          const isLast = idx === section.items.length - 1
          const cellValue = isYesNo
            ? (item.yesno_value === true ? 'Tak' : item.yesno_value === false ? 'Nie' : '—')
            : (item.state ? STATE_LABELS[item.state] || item.state : '—')

          return (
            <View key={item.id} style={isLast ? ps.checklistRowLast : ps.checklistRow}>
              <Text style={ps.cellLp}>{idx + 1}</Text>
              <Text style={ps.cellElement}>{item.element_name}</Text>
              <Text style={ps.cellState}>{cellValue}</Text>
              <Text style={ps.cellNotes}>{item.notes || '—'}</Text>
              <Text style={ps.cellPhoto}>
                {item.photo_refs && item.photo_refs.length > 0
                  ? item.photo_refs.join(', ')
                  : '—'}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
