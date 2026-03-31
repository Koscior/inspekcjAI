import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Phone, Mail, MapPin, ClipboardList, ChevronRight, User } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { ROUTES, buildPath } from '@/router/routePaths'
import { Button, Card, EmptyState, Spinner } from '@/components/ui'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useClients(search || undefined)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klienci</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.length} {data.length === 1 ? 'klient' : data.length < 5 ? 'klienci' : 'klientów'}
            </p>
          )}
        </div>
        <Button onClick={() => navigate(ROUTES.CLIENT_NEW)} className="gap-2">
          <Plus size={16} />
          Nowy klient
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Szukaj po imieniu lub emailu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* List */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Ładowanie klientów..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Błąd podczas ładowania klientów.
        </div>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <EmptyState
          icon={search ? Search : User}
          title={search ? 'Brak wyników' : 'Brak klientów'}
          description={
            search
              ? 'Zmień kryteria wyszukiwania.'
              : 'Dodaj pierwszego klienta klikając przycisk powyżej.'
          }
          action={
            !search
              ? { label: 'Nowy klient', onClick: () => navigate(ROUTES.CLIENT_NEW) }
              : undefined
          }
        />
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((client) => {
            const inspectionCount = (client as typeof client & { inspections: { count: number }[] })
              .inspections?.[0]?.count ?? 0

            return (
              <Card
                key={client.id}
                hover
                onClick={() => navigate(buildPath(ROUTES.CLIENT_DETAIL, { id: client.id }))}
                className="group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                      <User size={18} className="text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                        {client.full_name}
                      </div>
                      {inspectionCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <ClipboardList size={11} />
                          {inspectionCount} {inspectionCount === 1 ? 'inspekcja' : 'inspekcji'}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0 group-hover:text-primary-600 transition-colors mt-1" />
                </div>

                <div className="mt-3 space-y-1.5">
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <Mail size={13} className="shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <Phone size={13} className="shrink-0" />
                      {client.phone}
                    </a>
                  )}
                  {client.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </a>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
