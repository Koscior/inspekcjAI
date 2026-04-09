import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MapPin, User, Phone, Mail, Edit3, Trash2, Camera, Map, FileText,
  ChevronRight, Calendar, Save, Building2, Ruler, Users,
} from 'lucide-react'
import { useInspection, useDeleteInspection, useUpdateInspection } from '@/hooks/useInspections'
import { INSPECTION_TYPES } from '@/config/constants'
import { ROUTES, buildPath } from '@/router/routePaths'
import { Card, Button, Spinner, Badge } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/Modal'
import { InspectionNav } from '@/components/layout/InspectionNav'
import { useUiStore } from '@/store/uiStore'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Inspection } from '@/types/database.types'

const CHECKLIST_TYPES: Inspection['type'][] = ['roczny', 'piecioletni', 'polroczny', 'plac_zabaw']

export default function MorePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const deleteInspection = useDeleteInspection()
  const updateInspection = useUpdateInspection()

  const { data: inspection, isLoading, error } = useInspection(id)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Inline editing state
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [editingStatus, setEditingStatus] = useState(false)

  async function handleDelete() {
    if (!id) return
    try {
      await deleteInspection.mutateAsync(id)
      addToast({ type: 'success', message: 'Inspekcja została usunięta' })
      navigate(ROUTES.INSPECTIONS)
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas usuwania inspekcji' })
    }
  }

  async function handleSaveNotes() {
    if (!id) return
    try {
      await updateInspection.mutateAsync({ id, updates: { notes: notesValue } })
      addToast({ type: 'success', message: 'Notatki zapisane' })
      setEditingNotes(false)
    } catch {
      addToast({ type: 'error', message: 'Błąd zapisu notatek' })
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!id) return
    try {
      await updateInspection.mutateAsync({ id, updates: { status: newStatus } })
      addToast({ type: 'success', message: 'Status zaktualizowany' })
      setEditingStatus(false)
    } catch {
      addToast({ type: 'error', message: 'Błąd zmiany statusu' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie..." />
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Nie znaleziono inspekcji</p>
      </div>
    )
  }

  const insp = inspection as typeof inspection & {
    clients: { id: string; full_name: string; email: string | null; phone: string | null; address: string | null } | null
  }

  const hasChecklistType = CHECKLIST_TYPES.includes(insp.type as Inspection['type'])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <InspectionNav />

      {/* ─── Big edit button ────────────────────────────────────────────── */}
      <Button
        onClick={() => navigate(buildPath(ROUTES.INSPECTION_EDIT, { id: id! }))}
        className="w-full py-4 text-base font-bold gap-2"
      >
        <Edit3 size={20} />
        Edytuj informacje o inspekcji
      </Button>

      {/* ─── Status ─────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status inspekcji</h2>
          {!editingStatus && (
            <button
              onClick={() => setEditingStatus(true)}
              className="text-xs text-primary-600 font-medium hover:underline"
            >
              Zmień
            </button>
          )}
        </div>

        {editingStatus ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'draft', label: 'Szkic', color: 'bg-gray-100 text-gray-700 border-gray-200' },
              { value: 'in_progress', label: 'W trakcie', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { value: 'completed', label: 'Zakończona', color: 'bg-green-50 text-green-700 border-green-200' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className={`py-3 rounded-lg text-sm font-semibold text-center border transition-all active:scale-[0.97] ${
                  insp.status === s.value ? s.color + ' ring-2 ring-primary-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : (
          <Badge
            color={insp.status === 'completed' ? 'green' : insp.status === 'in_progress' ? 'blue' : 'gray'}
            size="md"
          >
            {insp.status === 'completed' ? 'Zakończona' : insp.status === 'in_progress' ? 'W trakcie' : 'Szkic'}
          </Badge>
        )}
      </Card>

      {/* ─── Inspection Info ────────────────────────────────────────────── */}
      <Card>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informacje</h2>

        <div className="space-y-3">
          <InfoRow label="Tytuł" value={insp.title} />
          <InfoRow label="Adres" value={insp.address} icon={<MapPin size={14} className="text-gray-400" />} />
          <InfoRow label="Typ" value={
            <Badge color="blue" size="sm">
              {INSPECTION_TYPES[insp.type as Inspection['type']]}
            </Badge>
          } />
          {insp.reference_number && (
            <InfoRow label="Numer ref." value={<span className="font-mono">{insp.reference_number}</span>} />
          )}
          {insp.city && <InfoRow label="Miasto" value={insp.city} />}
          {insp.building_type && <InfoRow label="Rodzaj budynku" value={insp.building_type} icon={<Building2 size={14} className="text-gray-400" />} />}
          {insp.construction_type && <InfoRow label="Konstrukcja" value={insp.construction_type} />}
          {insp.year_built && <InfoRow label="Rok budowy" value={insp.year_built} />}
          {insp.floor_or_unit && <InfoRow label="Piętro / lokal" value={insp.floor_or_unit} />}

          {/* Technical data */}
          {insp.powierzchnia_zabudowy && <InfoRow label="Pow. zabudowy" value={`${insp.powierzchnia_zabudowy} m²`} icon={<Ruler size={14} className="text-gray-400" />} />}
          {insp.powierzchnia_uzytkowa && <InfoRow label="Pow. użytkowa" value={`${insp.powierzchnia_uzytkowa} m²`} />}
          {insp.kubatura && <InfoRow label="Kubatura" value={`${insp.kubatura} m³`} />}
          {insp.kondygnacje_nadziemne && <InfoRow label="Kond. nadziemne" value={insp.kondygnacje_nadziemne} />}
          {insp.kondygnacje_podziemne && <InfoRow label="Kond. podziemne" value={insp.kondygnacje_podziemne} />}

          {/* Stakeholders */}
          {insp.owner_name && <InfoRow label="Właściciel" value={insp.owner_name} icon={<Users size={14} className="text-gray-400" />} />}
          {insp.manager_name && <InfoRow label="Administrator" value={insp.manager_name} />}
          {insp.investor_name && <InfoRow label="Inwestor" value={insp.investor_name} />}
          {insp.contractor_name && <InfoRow label="Wykonawca" value={insp.contractor_name} />}

          {/* Dates */}
          {insp.inspection_date && (
            <InfoRow label="Data inspekcji" value={
              format(new Date(insp.inspection_date), 'd MMMM yyyy', { locale: pl })
            } icon={<Calendar size={14} className="text-gray-400" />} />
          )}
          {insp.next_inspection_date && (
            <InfoRow label="Następna kontrola" value={
              format(new Date(insp.next_inspection_date), 'd MMMM yyyy', { locale: pl })
            } />
          )}
          <InfoRow label="Utworzono" value={
            format(new Date(insp.created_at), 'd MMMM yyyy, HH:mm', { locale: pl })
          } icon={<Calendar size={14} className="text-gray-400" />} />
        </div>
      </Card>

      {/* ─── Client ─────────────────────────────────────────────────────── */}
      {insp.clients && (
        <Card>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Klient</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              <User size={18} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">{insp.clients.full_name}</div>
              {insp.clients.address && (
                <p className="text-xs text-gray-500 truncate">{insp.clients.address}</p>
              )}
            </div>
            {insp.clients.phone && (
              <a
                href={`tel:${insp.clients.phone}`}
                className="p-2.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
              >
                <Phone size={18} />
              </a>
            )}
            {insp.clients.email && (
              <a
                href={`mailto:${insp.clients.email}`}
                className="p-2.5 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors"
              >
                <Mail size={18} />
              </a>
            )}
          </div>
        </Card>
      )}

      {/* ─── Notes (inline editable) ────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notatki</h2>
          {!editingNotes ? (
            <button
              onClick={() => {
                setNotesValue(insp.notes || '')
                setEditingNotes(true)
              }}
              className="text-xs text-primary-600 font-medium hover:underline"
            >
              {insp.notes ? 'Edytuj' : 'Dodaj'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingNotes(false)}
                className="text-xs text-gray-500 font-medium hover:underline"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveNotes}
                className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
              >
                <Save size={12} />
                Zapisz
              </button>
            </div>
          )}
        </div>

        {editingNotes ? (
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y min-h-[100px]"
            placeholder="Dodaj notatki do inspekcji..."
            autoFocus
          />
        ) : insp.notes ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{insp.notes}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Brak notatek</p>
        )}
      </Card>

      {/* ─── Quick links ────────────────────────────────────────────────── */}
      <Card className="p-0">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">
          Sekcje
        </h2>

        <button
          onClick={() => navigate(buildPath(ROUTES.INSPECTION_PHOTOS, { id: id! }))}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Camera size={20} className="text-primary-600" />
          <span className="flex-1 text-sm font-medium text-gray-900 text-left">Galeria zdjęć</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        {/* Floor plans for checklist types (non-checklist have it as main tab) */}
        {hasChecklistType && (
          <button
            onClick={() => navigate(buildPath(ROUTES.INSPECTION_FLOORPLANS, { id: id! }))}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <Map size={20} className="text-primary-600" />
            <span className="flex-1 text-sm font-medium text-gray-900 text-left">Rzuty / Plany budynku</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        )}

        {/* Building docs for non-checklist types (checklist have it as main tab) */}
        {!hasChecklistType && (
          <button
            onClick={() => navigate(buildPath(ROUTES.INSPECTION_BUILDING_DOCS, { id: id! }))}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <FileText size={20} className="text-primary-600" />
            <span className="flex-1 text-sm font-medium text-gray-900 text-left">Dokumentacja budynku</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        )}
      </Card>

      {/* ─── Danger zone ────────────────────────────────────────────────── */}
      <Card>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={16} className="mr-2" />
          Usuń inspekcję
        </Button>
      </Card>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Usuń inspekcję"
        message="Czy na pewno chcesz usunąć tę inspekcję? Tej operacji nie można cofnąć."
        confirmLabel="Usuń"
        danger
        loading={deleteInspection.isPending}
      />
    </div>
  )
}

// ─── Helper component ─────────────────────────────────────────────────────────

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className={icon ? '' : 'pl-0'}>
        <p className="text-xs text-gray-400">{label}</p>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  )
}
