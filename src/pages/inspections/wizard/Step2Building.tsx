import { useFormContext } from 'react-hook-form'
import { Input, Select, Textarea } from '@/components/ui'
import { BUILDING_CONSTRUCTION_TYPES } from '@/config/constants'
import type { WizardData } from '../NewInspectionPage'

const BUILDING_TYPES = [
  { value: 'mieszkalny',   label: 'Mieszkalny' },
  { value: 'uslugowy',     label: 'Usługowy' },
  { value: 'przemyslowy',  label: 'Przemysłowy' },
  { value: 'uzytecznosci', label: 'Użyteczności publicznej' },
  { value: 'inny',         label: 'Inny' },
]

const CONSTRUCTION_OPTIONS = BUILDING_CONSTRUCTION_TYPES.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))

export function Step2Building() {
  const { register, formState: { errors } } = useFormContext<WizardData>()

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Dane obiektu</h2>
      <p className="text-sm text-gray-500 mb-5">Informacje o budynku lub lokalu.</p>

      <div className="space-y-4">
        <Input
          label="Nazwa projektu / tytuł inspekcji"
          placeholder="np. Budynek mieszkalny ul. Kwiatowa 5"
          required
          error={errors.title?.message}
          {...register('title')}
        />

        <Input
          label="Adres"
          placeholder="ul. Kwiatowa 5"
          required
          error={errors.address?.message}
          {...register('address')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Miasto"
            placeholder="Warszawa"
            {...register('city')}
          />
          <Input
            label="Rok budowy"
            placeholder="1985"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            {...register('year_built')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Rodzaj budynku"
            placeholder="Wybierz..."
            options={BUILDING_TYPES}
            {...register('building_type')}
          />
          <Select
            label="Rodzaj konstrukcji"
            placeholder="Wybierz..."
            options={CONSTRUCTION_OPTIONS}
            {...register('construction_type')}
          />
        </div>

        <Input
          label="Piętro / numer lokalu"
          placeholder="np. Piętro 3, lok. 12 (opcjonalnie)"
          {...register('floor_or_unit')}
        />
      </div>
    </div>
  )
}
