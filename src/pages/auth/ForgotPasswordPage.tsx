import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useUiStore } from '@/store/uiStore'
import { Button, Input } from '@/components/ui'
import { ROUTES } from '@/router/routePaths'
import { ArrowLeft, Mail } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Nieprawidłowy adres e-mail'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const addToast = useUiStore((s) => s.addToast)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsLoading(false)

    if (error) {
      addToast({ type: 'error', message: 'Nie udało się wysłać linku resetującego. Spróbuj ponownie.' })
      return
    }

    setEmailSent(true)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sprawdź skrzynkę e-mail</h1>
          <p className="text-gray-500 text-sm mb-6">
            Wysłaliśmy link do resetowania hasła na adres{' '}
            <span className="font-medium text-gray-700">{getValues('email')}</span>.
            Link wygasa po 24 godzinach.
          </p>

          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Wróć do logowania
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Resetowanie hasła</h1>
          <p className="text-gray-500 text-sm mt-1">
            Podaj adres e-mail powiązany z kontem
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <Input
            label="Adres e-mail"
            type="email"
            placeholder="inspektor@firma.pl"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" className="w-full" loading={isLoading}>
            Wyślij link resetujący
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-1 text-primary-600 font-medium hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Wróć do logowania
          </Link>
        </p>
      </div>
    </div>
  )
}
