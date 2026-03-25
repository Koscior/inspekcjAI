import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input } from '@/components/ui'
import { ROUTES } from '@/router/routePaths'

const schema = z.object({
  fullName: z.string().min(2, 'Podaj imię i nazwisko'),
  email:    z.string().email('Nieprawidłowy adres e-mail'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Hasła nie są identyczne',
  path:    ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: authRegister, isLoading } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authRegister(data.email, data.password, data.fullName)
    } catch {
      // Toast is shown in useAuth
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Utwórz konto</h1>
          <p className="text-gray-500 text-sm mt-1">Bezpłatny start — 3 raporty miesięcznie</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <Input
            label="Imię i nazwisko"
            type="text"
            placeholder="Jan Kowalski"
            autoComplete="name"
            error={errors.fullName?.message}
            required
            {...register('fullName')}
          />
          <Input
            label="Adres e-mail"
            type="email"
            placeholder="inspektor@firma.pl"
            autoComplete="email"
            error={errors.email?.message}
            required
            {...register('email')}
          />
          <Input
            label="Hasło"
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
            Zarejestruj się za darmo
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Masz już konto?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary-600 font-medium hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}
