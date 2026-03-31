import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, MapPin, User, Trash2, Edit3, Phone, Mail,
} from 'lucide-react'
import { useInspection, useDeleteInspection } from '@/hooks/useInspections'
import { INSPECTION_TYPES } from '@/config/constants'
import { ROUTES } from '@/router/routePaths'
import { Badge, StatusBadge, Card, Spinner, Button } from '@/components/ui'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { useUiStore } from '@/store/uiStore'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Inspection } from '@/types/database.types'

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const deleteInspection = useDeleteInspection()

  const { data: inspection, isLoading, error } = useInspection(id)

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Czy na pewno chcesz usunąć tę inspekcję? Tej operacji nie można cofnąć.')) return

    try {
      await deleteInspection.mutateAsync(id)
      addToast({ type: 'success', message: 'Inspekcja została usunięta' })
      navigate(ROUTES.INSPECTIONS)
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas usuwania inspekcji' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie inspekcji..." />
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Nie znaleziono inspekcji</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(ROUTES.INSPECTIONS)}>
          Wróć do listy
        </Button>
      </div>
    )
  }

  const insp = inspection as typeof inspection & {
    clients: { id: string; full_name: string; email: string | null; phone: string | null; address: string | null } | null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back + actions row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.INSPECTIONS)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Inspekcje
        </button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addToast({ type: 'info', message: 'Edycja inspekcji — wkrótce dostępna' })}
          >
            <Edit3 size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            loading={deleteInspection.isPending}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* Header — compact */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge color="blue" size="sm">{INSPECTION_TYPES[insp.type as Inspection['type']]}</Badge>
          <StatusBadge status={insp.status} />
          {insp.reference_number && (
            <span className="text-xs text-gray-400 font-mono">{insp.reference_number}</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{insp.title}</h1>
        {insp.address && (
          <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
            <MapPin size={13} />
            {insp.address}
          </p>
        )}
      </div>

      {/* ── Sticky navigation ────────────────────────────────────────────── */}
      <InspectionNav />

      {/* ── Client card (quick contact) ──────────────────────────────────── */}
      {insp.clients && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              <User size={16} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">{insp.clients.full_name}</div>
            </div>
            {insp.clients.phone && (
              <a
                href={`tel:${insp.clients.phone}`}
                className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
              >
                <Phone size={16} />
              </a>
            )}
            {insp.clients.email && (
              <a
                href={`mailto:${insp.clients.email}`}
                className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors"
              >
                <Mail size={16} />
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Notes */}
      {insp.notes && (
        <Card>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notatki</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{insp.notes}</p>
        </Card>
      )}

      {/* Meta */}
      <p className="text-xs text-gray-400 text-center">
        Utworzono {format(new Date(insp.created_at), 'd MMM yyyy, HH:mm', { locale: pl })}
      </p>
    </div>
  )
}
