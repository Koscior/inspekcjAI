import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronRight, User, Shield, CreditCard, LogOut, Trash2,
  Building2, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { Button, Card, Badge, Input, ConfirmModal, Spinner, Modal } from '@/components/ui'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { supabase } from '@/config/supabase'
import { ROUTES } from '@/router/routePaths'
import { FREE_PLAN_REPORT_LIMIT } from '@/config/constants'

const DELETE_CONFIRMATION_PHRASE = 'USUŃ KONTO'

// ─── Password schema ─────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    new_password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Hasła muszą być identyczne',
    path: ['confirm_password'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

// ─── Plan labels ─────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  free: 'Plan Darmowy',
  pro: 'Plan Pro',
  company: 'Plan Firmowy',
}

const PLAN_COLORS: Record<string, 'gray' | 'blue' | 'green'> = {
  free: 'gray',
  pro: 'blue',
  company: 'green',
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
      {children}
    </h2>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const { logout } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  async function handlePasswordChange(data: PasswordForm) {
    const { error } = await supabase.auth.updateUser({ password: data.new_password })
    if (error) {
      addToast({ type: 'error', message: error.message || 'Błąd zmiany hasła' })
      return
    }
    setPasswordSaved(true)
    resetForm()
    addToast({ type: 'success', message: 'Hasło zostało zmienione' })
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  async function handleDeleteAccount() {
    if (deleteConfirmInput !== DELETE_CONFIRMATION_PHRASE) return
    setDeleting(true)
    try {
      const { error } = await supabase.rpc('delete_user_account')
      if (error) throw error
      await supabase.auth.signOut()
      navigate(ROUTES.LOGIN)
    } catch (err) {
      Sentry.captureException(err, { tags: { action: 'delete_account' } })
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Błąd podczas usuwania konta',
      })
    } finally {
      setDeleting(false)
      setDeleteModalOpen(false)
      setDeleteConfirmInput('')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  const plan = profile?.subscription_plan ?? 'free'
  const reportsUsed = profile?.reports_used_this_month ?? 0
  const reportsLimit = FREE_PLAN_REPORT_LIMIT
  const progressPct = Math.min(Math.round((reportsUsed / reportsLimit) * 100), 100)
  const isNearLimit = progressPct >= 80

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
        <p className="text-sm text-gray-500 mt-1">{profile?.email}</p>
      </div>

      {/* ── Profil i branding ──────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Profil i firma</SectionTitle>
        <Card
          hover
          onClick={() => navigate(ROUTES.COMPANY_PROFILE)}
          className="flex items-center justify-between p-4 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Profil firmy</p>
              <p className="text-xs text-gray-500">
                Dane osobowe, firma, logo, podpis, certyfikaty
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 shrink-0" />
        </Card>
      </section>

      {/* ── Subskrypcja ────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Subskrypcja</SectionTitle>
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Aktualny plan</p>
                <p className="text-xs text-gray-500">
                  {plan === 'free' ? `${reportsUsed} / ${reportsLimit} raportów w tym miesiącu` : 'Bez limitu raportów'}
                </p>
              </div>
            </div>
            <Badge color={PLAN_COLORS[plan] ?? 'gray'}>
              {PLAN_LABELS[plan] ?? plan}
            </Badge>
          </div>

          {plan === 'free' && (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Raporty</span>
                  <span className={isNearLimit ? 'text-red-600 font-medium' : ''}>
                    {reportsUsed} / {reportsLimit}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isNearLimit ? 'bg-red-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => navigate(ROUTES.SUBSCRIPTION)}
              >
                Upgrade do Pro — bez limitu raportów
              </Button>
            </>
          )}
        </Card>
      </section>

      {/* ── Bezpieczeństwo ─────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Bezpieczeństwo</SectionTitle>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Zmień hasło</p>
              <p className="text-xs text-gray-500">Minimalna długość: 8 znaków</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-3">
            <div>
              <Input
                type="password"
                placeholder="Nowe hasło"
                {...register('new_password')}
                error={errors.new_password?.message}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Powtórz nowe hasło"
                {...register('confirm_password')}
                error={errors.confirm_password?.message}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || passwordSaved}
              className="w-full gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : passwordSaved ? (
                <CheckCircle2 size={16} />
              ) : null}
              {passwordSaved ? 'Hasło zmienione' : 'Zmień hasło'}
            </Button>
          </form>
        </Card>
      </section>

      {/* ── Konto ──────────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Konto</SectionTitle>
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
              <User size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{profile?.full_name || '—'}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() => setLogoutModalOpen(true)}
          >
            <LogOut size={16} />
            Wyloguj się
          </Button>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Strefa niebezpieczna
            </p>
            <Button
              variant="ghost"
              className="w-full gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 size={16} />
              Usuń konto
            </Button>
          </div>
        </Card>
      </section>

      {/* ── Confirm logout modal ───────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={logout}
        title="Wyloguj się"
        message="Czy na pewno chcesz się wylogować?"
        confirmLabel="Wyloguj"
        danger
      />

      {/* ── Delete account modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteConfirmInput('') }}
        title="Usuń konto"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Ta operacja jest nieodwracalna.</p>
              <p>Zostaną trwale usunięte: Twoje konto, wszystkie inspekcje, usterki, zdjęcia, plany, raporty i dane klientów.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">
              Wpisz <span className="font-mono font-semibold text-red-600">{DELETE_CONFIRMATION_PHRASE}</span> aby potwierdzić:
            </label>
            <Input
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={DELETE_CONFIRMATION_PHRASE}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setDeleteModalOpen(false); setDeleteConfirmInput('') }}
              disabled={deleting}
            >
              Anuluj
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmInput !== DELETE_CONFIRMATION_PHRASE || deleting}
              loading={deleting}
            >
              <Trash2 size={16} className="mr-1.5" />
              Usuń konto na zawsze
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
