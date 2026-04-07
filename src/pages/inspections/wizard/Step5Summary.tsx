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
            {data.type !== 'plac_zabaw' && <Row label="Rodzaj budynku" value={data.building_type} />}
            {data.type !== 'plac_zabaw' && <Row label="Konstrukcja" value={data.construction_type} />}
            <Row label="Rok budowy" value={data.year_built} />
            {data.type !== 'plac_zabaw' && <Row label="Piętro / lokal" value={data.floor_or_unit} />}
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

        {data.type === 'plac_zabaw' && (data.pg_liczba_urzadzen || data.pg_rodzaje_urzadzen || data.pg_material_urzadzen || data.pg_nawierzchnia || data.pg_nawierzchnia_pod_urzadzeniami || data.pg_mocowanie_urzadzen || data.pg_ogrodzenie || data.pg_naslonecznienie) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Charakterystyka placu zabaw</h3>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3">
              <Row label="Liczba urządzeń" value={data.pg_liczba_urzadzen} />
              <Row label="Rodzaje urządzeń" value={data.pg_rodzaje_urzadzen} />
              <Row label="Materiały urządzeń" value={data.pg_material_urzadzen} />
              <Row label="Nawierzchnia" value={data.pg_nawierzchnia} />
              <Row label="Nawierzchnia pod urz." value={data.pg_nawierzchnia_pod_urzadzeniami} />
              <Row label="Mocowanie urządzeń" value={data.pg_mocowanie_urzadzen} />
              <Row label="Ogrodzenie" value={data.pg_ogrodzenie} />
              <Row label="Nasłonecznienie" value={data.pg_naslonecznienie} />
            </div>
          </div>
        )}

        {(data.powierzchnia_zabudowy || data.powierzchnia_uzytkowa || data.kubatura || data.kondygnacje_nadziemne || data.kondygnacje_podziemne) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Dane techniczne</h3>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3">
              <Row label="Pow. zabudowy" value={data.powierzchnia_zabudowy ? `${data.powierzchnia_zabudowy} m²` : undefined} />
              <Row label="Pow. użytkowa" value={data.powierzchnia_uzytkowa ? `${data.powierzchnia_uzytkowa} m²` : undefined} />
              <Row label="Kubatura" value={data.kubatura ? `${data.kubatura} m³` : undefined} />
              <Row label="Kondygnacje naziem." value={data.kondygnacje_nadziemne} />
              <Row label="Kondygnacje podziem." value={data.kondygnacje_podziemne} />
            </div>
          </div>
        )}

        {(data.inspection_date || data.next_inspection_date || data.owner_name || data.manager_name || data.investor_name || data.contractor_name || data.owner_address || data.owner_phone || data.owner_email || data.notes) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Szczegóły</h3>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3">
              <Row label="Data inspekcji" value={data.inspection_date} />
              <Row label="Następna kontrola" value={data.next_inspection_date} />
              <Row label="Właściciel" value={data.owner_name} />
              <Row label="Adres zarządcy" value={data.owner_address} />
              <Row label="Telefon zarządcy" value={data.owner_phone} />
              <Row label="E-mail zarządcy" value={data.owner_email} />
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
