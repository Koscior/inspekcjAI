import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { Building2, User } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { Button, Input } from '@/components/ui'
import { ROUTES } from '@/router/routePaths'

type Mode = 'solo' | 'company'

export default function OnboardingPage() {
  const [mode, setMode] = useState<Mode>('solo')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const setProfile = useAuthStore((s) => s.setProfile)
  const addToast = useUiStore((s) => s.addToast)
  const navigate = useNavigate()

  const handleContinue = async () => {
    if (!user) return
    setLoading(true)

    try {
      const updates: Record<string, unknown> = {
        onboarding_complete: true,
        role: mode === 'company' ? 'company_admin' : 'inspector',
      }

      if (mode === 'company' && companyName.trim()) {
        // Create company first
        const { data: company, error: companyError } = await supabase
          .from('companies')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert({ name: companyName.trim(), admin_id: user.id } as any)
          .select()
          .single()

        if (companyError) throw companyError

        updates.company_id = (company as { id: string }).id
        updates.company_name = companyName.trim()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(profile as never)
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      Sentry.captureException(err)
      addToast({ type: 'error', message: 'Błąd podczas konfiguracji konta' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Jak będziesz korzystać z InspekcjAI?</h1>
          <p className="text-gray-500 text-sm mt-2">Możesz to zmienić później w ustawieniach</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            {
              value: 'solo' as Mode,
              icon: User,
              title: 'Inspektor niezależny',
              desc: 'Pracuję samodzielnie',
            },
            {
              value: 'company' as Mode,
              icon: Building2,
              title: 'Firma inspektorska',
              desc: 'Zarządzam zespołem',
            },
          ].map(({ value, icon: Icon, title, desc }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={clsx(
                'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center',
                mode === value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              <div className={clsx(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                mode === value ? 'bg-primary-100' : 'bg-gray-100',
              )}>
                <Icon size={24} className={mode === value ? 'text-primary-600' : 'text-gray-500'} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Company name input */}
        {mode === 'company' && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
            <Input
              label="Nazwa firmy"
              placeholder="np. Budownictwo Kowalski sp. z o.o."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleContinue}
          loading={loading}
          disabled={mode === 'company' && !companyName.trim()}
        >
          Przejdź do aplikacji
        </Button>
      </div>
    </div>
  )
}
