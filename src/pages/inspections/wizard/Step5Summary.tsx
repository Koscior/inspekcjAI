import { INSPECTION_TYPES } from '@/config/constants'
import type { WizardData } from '../NewInspectionPage'

interface Step5SummaryProps {
  data: Partial<WizardData>
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  )
}

export function Step5Summary({ data }: Step5SummaryProps) {
  const fullAddress = [data.address, data.city].filter(Boolean).join(', ')

  const clientInfo =
    data.client_mode === 'existing'
      ? '(wybrany istniejący klient)'
      : data.client_mode === 'new' && data.new_client_name
      ? `${data.new_client_name}${data.new_client_email ? ` — ${data.new_client_email}` : ''} (nowy klient)`
      : null

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Podsumowanie</h2>
      <p className="text-sm text-gray-500 mb-5">Sprawdź dane przed utworzeniem inspekcji.</p>

      <div className="space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Typ inspekcji</h3>
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3">
            <Row label="Typ" value={data.type ? INSPECTION_TYPES[data.type] : undefined} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Dane obiektu</h3>
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3">
            <Row label="Nazwa" value={data.title} />
            <Row label="Adres" value={fullAddress || undefined} />
            <Row label="Rodzaj budynku" value={data.building_type} />
            <Row label="Konstrukcja" value={data.construction_type} />
            <Row label="Rok budowy" value={data.year_built} />
            <Row label="Piętro / lokal" value={data.floor_or_unit} />
          </div>
        </div>

        {clientInfo && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Klient</h3>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3">
              <Row label="Klient" value={clientInfo} />
            </div>
          </div>
        )}

        {(data.inspection_date || data.owner_name || data.manager_name || data.investor_name || data.contractor_name || data.notes) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Szczegóły</h3>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3">
              <Row label="Data inspekcji" value={data.inspection_date} />
              <Row label="Właściciel" value={data.owner_name} />
              <Row label="Administrator" value={data.manager_name} />
              <Row label="Inwestor" value={data.investor_name} />
              <Row label="Wykonawca" value={data.contractor_name} />
              <Row label="Notatki" value={data.notes} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-lg bg-primary-50 border border-primary-200 p-3 text-sm text-primary-700">
        Po utworzeniu inspekcja pojawi się jako <strong>Szkic</strong>. Możesz ją edytować i uzupełniać w dowolnym momencie.
      </div>
    </div>
  )
}
