import { useFormContext, Controller } from 'react-hook-form'
import { ClipboardList, Building2, Trees, Home, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import type { WizardData } from '../NewInspectionPage'
import type { Inspection } from '@/types/database.types'

interface TypeOption {
  value: Inspection['type']
  label: string
  description: string
  icon: React.ReactNode
  color: string
  legal?: string
}

const OPTIONS: TypeOption[] = [
  {
    value: 'roczny',
    label: 'Przegląd roczny',
    description: 'Obowiązkowy coroczny przegląd stanu technicznego budynku',
    icon: <ClipboardList size={24} />,
    color: 'blue',
    legal: 'Art. 62 ust. 1 pkt 1 PB',
  },
  {
    value: 'polroczny',
    label: 'Przegląd półroczny',
    description: 'Przegląd co 6 miesięcy dla wybranych obiektów',
    icon: <ClipboardList size={24} />,
    color: 'blue',
    legal: 'Art. 62 ust. 1 pkt 1 PB',
  },
  {
    value: 'piecioletni',
    label: 'Przegląd pięcioletni',
    description: 'Rozszerzony przegląd z kontrolą instalacji budynku',
    icon: <Building2 size={24} />,
    color: 'purple',
    legal: 'Art. 62 ust. 1 pkt 2 PB',
  },
  {
    value: 'plac_zabaw',
    label: 'Inspekcja placu zabaw',
    description: 'Kontrola stanu urządzeń placu zabaw wg norm EN 1176/1177',
    icon: <Trees size={24} />,
    color: 'green',
    legal: 'Normy EN 1176/1177',
  },
  {
    value: 'odbior_mieszkania',
    label: 'Odbiór mieszkania',
    description: 'Odbiór domu lub mieszkania od dewelopera',
    icon: <Home size={24} />,
    color: 'orange',
  },
  {
    value: 'ogolna',
    label: 'Inspekcja ogólna',
    description: 'Dowolna inspekcja techniczna bez z góry określonego formatu',
    icon: <FileText size={24} />,
    color: 'gray',
  },
]

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-500',   text: 'text-blue-700',   icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', icon: 'text-purple-600' },
  green:  { bg: 'bg-green-50',  border: 'border-green-500',  text: 'text-green-700',  icon: 'text-green-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', icon: 'text-orange-600' },
  gray:   { bg: 'bg-gray-50',   border: 'border-gray-400',   text: 'text-gray-700',   icon: 'text-gray-500' },
}

export function Step1Type() {
  const { control, formState: { errors } } = useFormContext<WizardData>()

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Wybierz typ inspekcji</h2>
      <p className="text-sm text-gray-500 mb-5">Typ określa formularz, checklistę i format raportu.</p>

      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((opt) => {
              const selected = field.value === opt.value
              const c = colorMap[opt.color]
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={clsx(
                    'text-left rounded-xl border-2 p-4 transition-all',
                    selected
                      ? `${c.bg} ${c.border}`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className={clsx('mb-2', selected ? c.icon : 'text-gray-400')}>
                    {opt.icon}
                  </div>
                  <div className={clsx('font-semibold text-sm', selected ? c.text : 'text-gray-900')}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                  {opt.legal && (
                    <div className="text-xs text-gray-400 mt-1">{opt.legal}</div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      />
      {errors.type && (
        <p className="mt-2 text-xs text-red-600">Wybierz typ inspekcji</p>
      )}
    </div>
  )
}
