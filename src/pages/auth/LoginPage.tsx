import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input } from '@/components/ui'
import { ROUTES } from '@/router/routePaths'

const schema = z.object({
  email:    z.string().email('Nieprawidłowy adres e-mail'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login, isLoading } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
    } catch {
      // Toast is shown in useAuth
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">InspekcjAI</h1>
          <p className="text-gray-500 text-sm mt-1">Zaloguj się do swojego konta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <Input
            label="Adres e-mail"
            type="email"
            placeholder="inspektor@firma.pl"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Hasło"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full" loading={isLoading}>
            Zaloguj się
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Nie masz konta?{' '}
          <Link to={ROUTES.REGISTER} className="text-primary-600 font-medium hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}
