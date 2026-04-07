import { Document, Page, View, Text } from '@react-pdf/renderer'
import '@/components/reports/fonts'
import { styles as s } from './shared/PDFStyles'
import { CoverPage } from './shared/CoverPage'
import { renderFloorPlanPages } from './shared/FloorPlanPage'
import { CategorySection } from './shared/DefectSection'
import { PageFooter } from './shared/PageFooter'
import { SignatureSection } from './shared/SignatureSection'
import type { ReportData } from '@/services/reportDataService'

const REPORT_TITLE = 'RAPORT TECHNICZNY'

interface TechnicalReportProps {
  data: ReportData
}

export function TechnicalReport({ data }: TechnicalReportProps) {
  const categories = Object.entries(data.defectsByCategory)

  return (
    <Document title={`${REPORT_TITLE} — ${data.inspection.title}`} author={data.profile.full_name}>
      {/* 1. Cover page */}
      <CoverPage data={data} reportTitle={REPORT_TITLE} />

      {/* 2. Floor plans with all pins (overview) */}
      {renderFloorPlanPages(data, REPORT_TITLE)}

      {/* 3. Defects grouped by category */}
      {categories.length > 0 && (
        <Page size="A4" style={s.page} wrap>
          {categories.map(([category, defects], idx) => (
            <CategorySection
              key={category}
              category={category}
              defects={defects}
              photoImages={data.photoImages}
              floorPlanImages={data.floorPlanImages}
              floorPlans={data.floorPlans}
              isFirst={idx === 0}
            />
          ))}

          {/* Signatures */}
          <SignatureSection
            inspectorName={data.profile.full_name}
            inspectorSignatureBase64={data.inspectorSignatureBase64}
            clientSignatureUrl={data.clientSignatureUrl}
          />

          <PageFooter reportType={REPORT_TITLE} reportNumber={data.reportNumber} />
        </Page>
      )}
    </Document>
  )
}
