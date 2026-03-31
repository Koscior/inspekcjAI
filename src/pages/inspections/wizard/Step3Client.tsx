import { useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Search, Plus, User, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Input } from '@/components/ui'
import { useClients } from '@/hooks/useClients'
import type { WizardData } from '../NewInspectionPage'
import type { Client } from '@/types/database.types'

type ClientMode = 'none' | 'existing' | 'new'

export function Step3Client() {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext<WizardData>()
  const [search, setSearch] = useState('')
  const mode = watch('client_mode') as ClientMode
  const selectedClientId = watch('client_id')

  const { data: clients, isLoading } = useClients(search || undefined)

  function selectClient(client: Client) {
    setValue('client_id', client.id)
    setValue('client_mode', 'existing')
    setSearch('')
  }

  function clearClient() {
    setValue('client_id', undefined)
    setValue('client_mode', 'none')
  }

  const selectedClient = clients?.find((c) => c.id === selectedClientId)

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Klient</h2>
      <p className="text-sm text-gray-500 mb-5">Możesz pominąć ten krok i dodać klienta później.</p>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { value: 'none', label: 'Pomiń' },
          { value: 'existing', label: 'Wybierz istniejącego' },
          { value: 'new', label: 'Dodaj nowego' },
        ] as const).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setValue('client_mode', tab.value)
              if (tab.value !== 'existing') setValue('client_id', undefined)
            }}
            className={clsx(
              'px-3 py-1.5 text-sm rounded-lg border transition-colors',
              mode === tab.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Existing client search */}
      {mode === 'existing' && (
        <div className="space-y-3">
          {selectedClient ? (
            <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                <User size={16} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{selectedClient.full_name}</div>
                {selectedClient.email && (
                  <div className="text-xs text-gray-500">{selectedClient.email}</div>
                )}
              </div>
              <button type="button" onClick={clearClient} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj po imieniu lub emailu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {isLoading && (
                <p className="text-sm text-gray-400 text-center py-4">Ładowanie...</p>
              )}

              {!isLoading && clients?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  {search ? 'Brak wyników' : 'Brak klientów — dodaj nowego'}
                </p>
              )}

              {!isLoading && clients && clients.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <User size={14} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{client.full_name}</div>
                        {client.email && <div className="text-xs text-gray-500">{client.email}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* New client form */}
      {mode === 'new' && (
        <div className="space-y-3">
          <Input
            label="Imię i nazwisko"
            placeholder="Jan Kowalski"
            required
            error={errors.new_client_name?.message}
            {...register('new_client_name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="jan@example.com"
              {...register('new_client_email')}
            />
            <Input
              label="Telefon"
              type="tel"
              placeholder="+48 600 000 000"
              {...register('new_client_phone')}
            />
          </div>
        </div>
      )}

      {/* None */}
      {mode === 'none' && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-500 text-center">
          Inspekcja zostanie utworzona bez przypisanego klienta. Możesz go dodać później w szczegółach inspekcji.
        </div>
      )}
    </div>
  )
}
