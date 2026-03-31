import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, User, ClipboardList,
  Trash2, Edit3, ChevronRight, Calendar,
} from 'lucide-react'
import { useClient, useDeleteClient } from '@/hooks/useClients'
import { ROUTES, buildPath } from '@/router/routePaths'
import { Badge, StatusBadge, Card, Spinner, Button } from '@/components/ui'
import { useUiStore } from '@/store/uiStore'
import { INSPECTION_TYPES } from '@/config/constants'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Inspection } from '@/types/database.types'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const deleteClient = useDeleteClient()

  const { data: client, isLoading, error } = useClient(id)

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Czy na pewno chcesz usunąć tego klienta?')) return
    try {
      await deleteClient.mutateAsync(id)
      addToast({ type: 'success', message: 'Klient został usunięty' })
      navigate(ROUTES.CLIENTS)
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas usuwania klienta' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie..." />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Nie znaleziono klienta</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(ROUTES.CLIENTS)}>
          Wróć do listy
        </Button>
      </div>
    )
  }

  type InspectionItem = {
    id: string
    title: string
    type: string
    status: string
    inspection_date: string | null
    created_at: string
    reports: { count: number }[]
  }

  const inspections = (client as typeof client & { inspections: InspectionItem[] }).inspections ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate(ROUTES.CLIENTS)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        Klienci
      </button>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              <User size={26} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.full_name}</h1>
              {inspections.length > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  <ClipboardList size={12} className="inline mr-1" />
                  {inspections.length} {inspections.length === 1 ? 'inspekcja' : 'inspekcji'}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addToast({ type: 'info', message: 'Edycja klienta — wkrótce' })}
            >
              <Edit3 size={15} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={deleteClient.isPending}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-4 space-y-2">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-2.5 text-sm text-primary-600 hover:underline"
            >
              <Mail size={15} className="shrink-0" />
              {client.email}
            </a>
          )}
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-2.5 text-sm text-primary-600 hover:underline"
            >
              <Phone size={15} className="shrink-0" />
              {client.phone}
            </a>
          )}
          {client.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-primary-600 hover:underline"
            >
              <MapPin size={15} className="shrink-0" />
              {client.address}
            </a>
          )}
        </div>

        {client.notes && (
          <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{client.notes}</p>
        )}
      </Card>

      {/* Inspection history */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Historia inspekcji
        </h2>

        {inspections.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            Brak inspekcji dla tego klienta
          </div>
        ) : (
          <div className="space-y-2">
            {inspections.map((insp) => (
              <Card
                key={insp.id}
                hover
                padding="sm"
                onClick={() => navigate(buildPath(ROUTES.INSPECTION_DETAIL, { id: insp.id }))}
                className="group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge color="blue" size="sm">
                        {INSPECTION_TYPES[insp.type as Inspection['type']]?.split(' ')[0] ?? insp.type}
                      </Badge>
                      <StatusBadge status={insp.status} />
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                      {insp.title}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Calendar size={11} />
                      {insp.inspection_date
                        ? format(new Date(insp.inspection_date), 'd MMM yyyy', { locale: pl })
                        : format(new Date(insp.created_at), 'd MMM yyyy', { locale: pl })}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0 group-hover:text-primary-600 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
