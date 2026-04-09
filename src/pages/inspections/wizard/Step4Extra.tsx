import { useFormContext } from 'react-hook-form'
import { Input, Textarea } from '@/components/ui'
import type { WizardData } from '../NewInspectionPage'
import type { Inspection } from '@/types/database.types'

interface Step4ExtraProps {
  inspectionType: Inspection['type']
}

export function Step4Extra({ inspectionType }: Step4ExtraProps) {
  const { register } = useFormContext<WizardData>()

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Dodatkowe informacje</h2>
      <p className="text-sm text-gray-500 mb-5">Wszystkie pola są opcjonalne — możesz uzupełnić je później.</p>

      <div className="space-y-4">
        {/* Dates — always */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data inspekcji"
            type="date"
            {...register('inspection_date')}
          />
          <Input
            label="Data następnej kontroli"
            type="date"
            {...register('next_inspection_date')}
          />
        </div>

        {/* Roczny / Pięcioletni / Półroczny */}
        {(inspectionType === 'roczny' || inspectionType === 'piecioletni' || inspectionType === 'polroczny') && (
          <>
            <Input
              label="Właściciel / zarządca"
              placeholder="np. Wspólnota Mieszkaniowa, Urząd Gminy"
              {...register('owner_name')}
            />
            <Input
              label="Adres"
              placeholder="ul. Przykładowa 1, 00-000 Miasto"
              {...register('owner_address')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Telefon kontaktowy"
                type="tel"
                placeholder="np. 500 600 700"
                {...register('owner_phone')}
              />
              <Input
                label="E-mail"
                type="email"
                placeholder="kontakt@example.pl"
                {...register('owner_email')}
              />
            </div>
          </>
        )}

        {/* Odbiór mieszkania */}
        {inspectionType === 'odbior_mieszkania' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Deweloper / Inwestor"
              placeholder="Nazwa firmy"
              {...register('investor_name')}
            />
            <Input
              label="Generalny wykonawca"
              placeholder="Nazwa firmy"
              {...register('contractor_name')}
            />
          </div>
        )}

        {/* Plac zabaw */}
        {inspectionType === 'plac_zabaw' && (
          <>
            <Input
              label="Właściciel / zarządca placu"
              placeholder="np. Urząd Gminy, Wspólnota Mieszkaniowa"
              {...register('owner_name')}
            />
            <Input
              label="Adres zarządcy"
              placeholder="ul. Przykładowa 1, 00-000 Miasto"
              {...register('owner_address')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Telefon"
                type="tel"
                placeholder="np. 500 600 700"
                {...register('owner_phone')}
              />
              <Input
                label="E-mail"
                type="email"
                placeholder="kontakt@example.pl"
                {...register('owner_email')}
              />
            </div>
          </>
        )}

        {/* Notes — always */}
        <Textarea
          label="Dodatkowe notatki"
          placeholder="Cel inspekcji, uwagi ogólne..."
          rows={3}
          {...register('notes')}
        />
      </div>
    </div>
  )
}
