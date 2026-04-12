import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Zap, ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Button, Card, Badge, Input } from '@/components/ui'
import { useProfile } from '@/hooks/useProfile'
import { useUiStore } from '@/store/uiStore'
import { ROUTES } from '@/router/routePaths'
import { FREE_PLAN_REPORT_LIMIT } from '@/config/constants'

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Darmowy',
    price: '0 zł',
    period: '/miesiąc',
    badge: null as 'gray' | 'blue' | 'green' | null,
    highlight: false,
    features: [
      `${FREE_PLAN_REPORT_LIMIT} raporty PDF miesięcznie`,
      'Wszystkie typy inspekcji',
      'Tryb offline',
      'Zarządzanie klientami',
      'Zdjęcia z annotacjami',
      'Plany z pinezkami',
      'Głos → tekst (AI)',
    ],
    unavailable: [
      'Wysyłka raportów emailem',
      'Własny branding PDF',
      'Priorytetowe wsparcie',
    ],
    cta: 'Aktualny plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Wkrótce',
    period: '',
    badge: 'blue' as const,
    highlight: true,
    features: [
      'Nieograniczone raporty PDF',
      'Wysyłka raportów emailem',
      'Własny branding PDF (logo, kolory)',
      'Priorytetowe wsparcie',
      'Wszystkie funkcje planu Darmowego',
    ],
    unavailable: ['Wielu inspektorów', 'Konta zespołowe'],
    cta: 'Dołącz do listy oczekujących',
    ctaDisabled: false,
  },
  {
    id: 'company',
    name: 'Firmowy',
    price: 'Wkrótce',
    period: '',
    badge: 'green' as const,
    highlight: false,
    features: [
      'Wszystko z planu Pro',
      'Wielu inspektorów (konta zespołowe)',
      'Panel administratora firmy',
      'Raporty zbiorcze',
      'Dedykowane wsparcie',
    ],
    unavailable: [],
    cta: 'Dołącz do listy oczekujących',
    ctaDisabled: false,
  },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const addToast = useUiStore((s) => s.addToast)

  const [waitlistEmail, setWaitlistEmail] = useState(profile?.email ?? '')
  const [waitlistPlan, setWaitlistPlan] = useState<'pro' | 'company' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const currentPlan = profile?.subscription_plan ?? 'free'
  const reportsUsed = profile?.reports_used_this_month ?? 0
  const progressPct = Math.min(Math.round((reportsUsed / FREE_PLAN_REPORT_LIMIT) * 100), 100)
  const isNearLimit = progressPct >= 80

  const handleWaitlist = async (planId: 'pro' | 'company') => {
    if (!waitlistEmail.trim()) {
      addToast({ type: 'error', message: 'Wpisz adres email' })
      return
    }
    setWaitlistPlan(planId)
    setSubmitting(true)
    // Simulate async intent (Stripe/billing not yet implemented)
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    setSubmitted(true)
    addToast({
      type: 'success',
      message: 'Zapisano na listę oczekujących! Damy znać gdy plan będzie dostępny.',
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plany subskrypcji</h1>
          <p className="text-sm text-gray-500 mt-0.5">Wybierz plan dopasowany do Twoich potrzeb</p>
        </div>
      </div>

      {/* Current usage bar (free plan only) */}
      {currentPlan === 'free' && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Raporty w tym miesiącu</p>
            <span className={`text-sm font-semibold ${isNearLimit ? 'text-red-600' : 'text-gray-700'}`}>
              {reportsUsed} / {FREE_PLAN_REPORT_LIMIT}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {isNearLimit && (
            <p className="text-xs text-red-600 mt-2">
              Zbliżasz się do limitu — rozważ upgrade do planu Pro.
            </p>
          )}
        </Card>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          return (
            <Card
              key={plan.id}
              className={`p-5 flex flex-col relative ${
                plan.highlight
                  ? 'ring-2 ring-primary-500 shadow-lg'
                  : ''
              } ${isCurrent ? 'bg-gray-50' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Polecany
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Plan {plan.name}</h2>
                  {plan.badge && <Badge color={plan.badge}>{plan.name}</Badge>}
                  {isCurrent && <Badge color="gray">Aktualny</Badge>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check size={15} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
                {plan.unavailable.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="w-[15px] shrink-0 mt-0.5 text-center">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && !plan.ctaDisabled && (
                <Button
                  variant={plan.highlight ? 'primary' : 'outline'}
                  className="w-full mt-auto"
                  onClick={() => handleWaitlist(plan.id as 'pro' | 'company')}
                  disabled={submitting && waitlistPlan === plan.id}
                >
                  {submitting && waitlistPlan === plan.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </Button>
              )}

              {isCurrent && (
                <div className="mt-auto pt-2">
                  <span className="block text-center text-sm text-gray-400 font-medium">Twój aktualny plan</span>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Waitlist form */}
      {!submitted ? (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={18} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Dołącz do listy oczekujących
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Plany Pro i Firmowy są w przygotowaniu. Zostaw email — damy znać jako pierwsi, gdy będą dostępne.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="twoj@email.pl"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleWaitlist('pro')}
                  disabled={submitting}
                  className="shrink-0"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Zapisz mnie'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-5 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">Zapisano na listę oczekujących!</p>
              <p className="text-sm text-green-700 mt-0.5">
                Damy znać na adres <span className="font-medium">{waitlistEmail}</span> gdy plan będzie dostępny.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Contact section */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Pytania dotyczące planów?{' '}
          <a href="mailto:kontakt@inspekcjai.pl" className="text-primary-600 hover:underline font-medium">
            kontakt@inspekcjai.pl
          </a>
        </p>
      </div>
    </div>
  )
}
