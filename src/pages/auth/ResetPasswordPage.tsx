import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { useUiStore } from '@/store/uiStore'
import { Button, Input, PageSpinner } from '@/components/ui'
import { ROUTES } from '@/router/routePaths'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const schema = z.object({
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Hasła nie są identyczne',
  path:    ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const addToast = useUiStore((s) => s.addToast)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash
    // and creates a session. We check if a session exists.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsValidToken(!!session)
    })

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setIsLoading(false)

    if (error) {
      addToast({ type: 'error', message: error.message || 'Nie udało się zmienić hasła. Spróbuj ponownie.' })
      return
    }

    // Sign out so user logs in with new password
    await supabase.auth.signOut()

    addToast({ type: 'success', message: 'Hasło zostało zmienione. Zaloguj się nowym hasłem.' })
    navigate(ROUTES.LOGIN)
  }

  if (isValidToken === null) {
    return <PageSpinner />
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link wygasł</h1>
          <p className="text-gray-500 text-sm mb-6">
            Link do resetowania hasła wygasł lub jest nieprawidłowy. Wygeneruj nowy link.
          </p>

          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Wyślij nowy link
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
          <h1 className="text-2xl font-bold text-gray-900">Nowe hasło</h1>
          <p className="text-gray-500 text-sm mt-1">Ustaw nowe hasło do swojego konta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <Input
            label="Nowe hasło"
            type="password"
            placeholder="Min. 8 znaków"
            autoComplete="new-password"
            error={errors.password?.message}
            required
            {...register('password')}
          />
          <Input
            label="Potwierdź hasło"
            type="password"
            placeholder="Powtórz hasło"
            autoComplete="new-password"
            error={errors.confirm?.message}
            required
            {...register('confirm')}
          />

          <Button type="submit" className="w-full" loading={isLoading}>
            Zmień hasło
          </Button>
        </form>
      </div>
    </div>
  )
}
