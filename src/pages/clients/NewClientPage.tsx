import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import { Input, Textarea, Button } from '@/components/ui'
import { useCreateClient } from '@/hooks/useClients'
import { ROUTES, buildPath } from '@/router/routePaths'
import { useUiStore } from '@/store/uiStore'

const schema = z.object({
  full_name:  z.string().min(2, 'Wymagane minimum 2 znaki'),
  email:      z.string().email('Nieprawidłowy adres email').or(z.literal('')).optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  notes:      z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewClientPage() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const createClient = useCreateClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        const client = await createClient.mutateAsync({
          full_name: data.full_name,
          email:     data.email || null,
          phone:     data.phone || null,
          address:   data.address || null,
          notes:     data.notes || null,
        })
        addToast({ type: 'success', message: 'Klient został dodany' })
        navigate(buildPath(ROUTES.CLIENT_DETAIL, { id: client.id }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Błąd podczas dodawania klienta'
        addToast({ type: 'error', message, duration: 8000 })
      }
    },
    () => {
      addToast({ type: 'error', message: 'Formularz zawiera błędy', duration: 6000 })
    },
  )

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate(ROUTES.CLIENTS)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft size={16} />
        Klienci
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nowy klient</h1>

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
          <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.CLIENTS)}>
            Anuluj
          </Button>
          <Button type="submit" loading={createClient.isPending}>
            Dodaj klienta
          </Button>
        </div>
      </form>
    </div>
  )
}
