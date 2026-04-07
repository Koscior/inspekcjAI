import { useFormContext } from 'react-hook-form'
import { Input, Select } from '@/components/ui'
import { BUILDING_CONSTRUCTION_TYPES } from '@/config/constants'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { CoverPhotoPicker } from './CoverPhotoPicker'
import type { WizardData } from '../NewInspectionPage'
import type { Inspection } from '@/types/database.types'

interface Step2BuildingProps {
  inspectionType?: Inspection['type']
  coverPhotoFile: File | null
  coverPhotoPreview: string | null
  onCoverPhotoChange: (file: File | null) => void
}

const BUILDING_TYPES = [
  { value: 'mieszkalny',   label: 'Mieszkalny' },
  { value: 'uslugowy',     label: 'Usługowy' },
  { value: 'przemyslowy',  label: 'Przemysłowy' },
  { value: 'uzytecznosci', label: 'Użyteczności publicznej' },
  { value: 'inny',         label: 'Inny' },
]

const CONSTRUCTION_OPTIONS = BUILDING_CONSTRUCTION_TYPES.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))

const TYPES_WITH_TECHNICAL_DATA = ['roczny', 'polroczny', 'piecioletni']

export function Step2Building({ inspectionType, coverPhotoFile, coverPhotoPreview, onCoverPhotoChange }: Step2BuildingProps) {
  const { register, setValue, formState: { errors } } = useFormContext<WizardData>()

  const isPlayground = inspectionType === 'plac_zabaw'
  const showTechnical = inspectionType && TYPES_WITH_TECHNICAL_DATA.includes(inspectionType)
  const showUnderground = inspectionType === 'piecioletni'

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

        {!isPlayground && (
          <>
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
          </>
        )}

        {/* Playground-specific fields */}
        {isPlayground && (
          <>
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ogólna charakterystyka placu zabaw</h3>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Liczba urządzeń</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_liczba_urzadzen', text, { shouldDirty: true })}
                  context="liczba urządzeń na placu zabaw"
                />
              </div>
              <Input placeholder="np. 12" {...register('pg_liczba_urzadzen')} />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Rodzaje urządzeń</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_rodzaje_urzadzen', text, { shouldDirty: true })}
                  context="rodzaje urządzeń na placu zabaw"
                />
              </div>
              <Input placeholder="np. huśtawki, zjeżdżalnie, karuzele" {...register('pg_rodzaje_urzadzen')} />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Rodzaj materiałów urządzeń</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_material_urzadzen', text, { shouldDirty: true })}
                  context="rodzaj materiałów użytych do produkcji urządzeń placu zabaw"
                />
              </div>
              <Input placeholder="np. drewno, stal, aluminium, tworzywa sztuczne" {...register('pg_material_urzadzen')} />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Rodzaj nawierzchni</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_nawierzchnia', text, { shouldDirty: true })}
                  context="rodzaj nawierzchni placu zabaw"
                />
              </div>
              <Input placeholder="np. trawa, piasek, kostka brukowa" {...register('pg_nawierzchnia')} />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Rodzaj nawierzchni pod urządzeniami</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_nawierzchnia_pod_urzadzeniami', text, { shouldDirty: true })}
                  context="rodzaj nawierzchni pod urządzeniami placu zabaw"
                />
              </div>
              <Input placeholder="np. piasek, mata gumowa, żwir" {...register('pg_nawierzchnia_pod_urzadzeniami')} />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Sposób mocowania urządzeń w gruncie</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_mocowanie_urzadzen', text, { shouldDirty: true })}
                  context="sposób mocowania urządzeń placu zabaw w gruncie"
                />
              </div>
              <Input placeholder="np. zabetonowane, zabetonowane w kotwach stalowych, wkopane" {...register('pg_mocowanie_urzadzen')} />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Rodzaj ogrodzenia</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_ogrodzenie', text, { shouldDirty: true })}
                  context="rodzaj ogrodzenia placu zabaw"
                />
              </div>
              <Input placeholder="np. metalowe, drewniane, brak" {...register('pg_ogrodzenie')} />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">Nasłonecznienie placu zabaw</label>
                <VoiceRecorder
                  onTranscription={(text) => setValue('pg_naslonecznienie', text, { shouldDirty: true })}
                  context="nasłonecznienie placu zabaw"
                />
              </div>
              <Input placeholder="np. częściowo zacieniony" {...register('pg_naslonecznienie')} />
            </div>
          </>
        )}

        {/* Technical data — only for roczny/polroczny/piecioletni */}
        {showTechnical && (
          <>
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Dane techniczne budynku</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Powierzchnia zabudowy (m²)"
                placeholder="np. 450"
                type="number"
                min={0}
                step="0.01"
                {...register('powierzchnia_zabudowy')}
              />
              <Input
                label="Powierzchnia użytkowa (m²)"
                placeholder="np. 1200"
                type="number"
                min={0}
                step="0.01"
                {...register('powierzchnia_uzytkowa')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Kubatura (m³)"
                placeholder="np. 3600"
                type="number"
                min={0}
                step="0.01"
                {...register('kubatura')}
              />
              <Input
                label="Kondygnacje nadziemne"
                placeholder="np. 4"
                type="number"
                min={0}
                {...register('kondygnacje_nadziemne')}
              />
            </div>

            {showUnderground && (
              <Input
                label="Kondygnacje podziemne"
                placeholder="np. 1"
                type="number"
                min={0}
                {...register('kondygnacje_podziemne')}
              />
            )}
          </>
        )}

        {/* Cover photo */}
        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Zdjęcie okładkowe</h3>
          <p className="text-xs text-gray-400 mb-3">Opcjonalne zdjęcie budynku na okładkę raportu.</p>
        </div>
        <CoverPhotoPicker
          file={coverPhotoFile}
          previewUrl={coverPhotoPreview}
          onChange={onCoverPhotoChange}
        />
      </div>
    </div>
  )
}
