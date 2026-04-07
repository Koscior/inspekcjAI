import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft } from 'lucide-react'
import { Input, Textarea, Button, Spinner } from '@/components/ui'
import { useClient, useUpdateClient } from '@/hooks/useClients'
import { ROUTES, buildPath } from '@/router/routePaths'
import { useUiStore } from '@/store/uiStore'
import { clientSchema, type ClientFormData } from './clientSchema'

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const updateClient = useUpdateClient()

  const { data: client, isLoading } = useClient(id)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  })

  useEffect(() => {
    if (client) {
      reset({
        full_name: client.full_name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      })
    }
  }, [client, reset])

  const onSubmit = handleSubmit(
    async (data) => {
      if (!id) return
      try {
        await updateClient.mutateAsync({
          id,
          updates: {
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            notes: data.notes || null,
          },
        })
        addToast({ type: 'success', message: 'Dane klienta zostały zaktualizowane' })
        navigate(buildPath(ROUTES.CLIENT_DETAIL, { id }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Błąd podczas aktualizacji klienta'
        addToast({ type: 'error', message, duration: 8000 })
      }
    },
    () => {
      addToast({ type: 'error', message: 'Formularz zawiera błędy', duration: 6000 })
    },
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie..." />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Nie znaleziono klienta</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(ROUTES.CLIENTS)}>
          Wróć do listy
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate(buildPath(ROUTES.CLIENT_DETAIL, { id: id! }))}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft size={16} />
        Klient
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edytuj klienta</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <Input
          label="Imię i nazwisko"
          placeholder="Jan Kowalski"
          required
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email"
            type="email"
            placeholder="jan@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Telefon"
            type="tel"
            placeholder="+48 600 000 000"
            {...register('phone')}
          />
        </div>
        <Input
          label="Adres"
          placeholder="ul. Kwiatowa 5, Warszawa"
          {...register('address')}
        />
        <Textarea
          label="Notatki"
          placeholder="Dodatkowe informacje..."
          rows={3}
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(buildPath(ROUTES.CLIENT_DETAIL, { id: id! }))}>
            Anuluj
          </Button>
          <Button type="submit" loading={updateClient.isPending}>
            Zapisz zmiany
          </Button>
        </div>
      </form>
    </div>
  )
}
