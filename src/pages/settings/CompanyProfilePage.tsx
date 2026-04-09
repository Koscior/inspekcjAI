import { useState, useRef, useEffect, useCallback } from 'react'
import {
  User, Building2, Award, Image, PenTool, Save, Upload,
  Trash2, ArrowLeft, Shield, Phone, Mail, Hash, CreditCard,
} from 'lucide-react'
import { Input, Card, Button, Spinner } from '@/components/ui'
import { SignaturePad } from '@/components/signature/SignaturePad'
import {
  useProfile,
  useUpdateProfile,
  useUploadLogo,
  useDeleteLogo,
  useUploadSignature,
  useDeleteSignature,
} from '@/hooks/useProfile'
import { useUiStore } from '@/store/uiStore'
import { useNavigate } from 'react-router-dom'

type ProfileTab = 'personal' | 'company' | 'certifications' | 'branding' | 'signature'

const TABS: { key: ProfileTab; label: string; icon: typeof User }[] = [
  { key: 'personal', label: 'Dane osobowe', icon: User },
  { key: 'company', label: 'Firma', icon: Building2 },
  { key: 'certifications', label: 'Uprawnienia', icon: Award },
  { key: 'branding', label: 'Logo', icon: Image },
  { key: 'signature', label: 'Podpis', icon: PenTool },
]

export default function CompanyProfilePage() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadLogo = useUploadLogo()
  const deleteLogo = useDeleteLogo()
  const uploadSignature = useUploadSignature()
  const deleteSignature = useDeleteSignature()

  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')

  // ── Form state ──────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [poiibNumber, setPoiibNumber] = useState('')

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false)

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setEmail(profile.email || '')
      setPhone(profile.phone || '')
      setCompanyName(profile.company_name || '')
      setLicenseNumber(profile.license_number || '')
      setPoiibNumber(profile.poiib_number || '')
      setIsDirty(false)
    }
  }, [profile])

  // Mark dirty on any field change
  const handleFieldChange = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T) => {
        setter(value)
        setIsDirty(true)
      },
    []
  )

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        company_name: companyName.trim() || null,
        license_number: licenseNumber.trim() || null,
        poiib_number: poiibNumber.trim() || null,
      })
      addToast({ type: 'success', message: 'Profil zapisany pomyślnie' })
      setIsDirty(false)
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas zapisywania profilu' })
    }
  }

  // ── Logo upload ─────────────────────────────────────────────────────────────
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Wybierz plik graficzny (PNG, JPG, SVG)' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'error', message: 'Logo nie może być większe niż 5 MB' })
      return
    }

    try {
      await uploadLogo.mutateAsync(file)
      addToast({ type: 'success', message: 'Logo zostało zaktualizowane' })
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas wgrywania logo' })
    }

    // Reset input
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleLogoDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć logo?')) return
    try {
      await deleteLogo.mutateAsync()
      addToast({ type: 'success', message: 'Logo zostało usunięte' })
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas usuwania logo' })
    }
  }

  // ── Signature ───────────────────────────────────────────────────────────────
  const handleSignatureSave = async (blob: Blob) => {
    try {
      await uploadSignature.mutateAsync(blob)
      addToast({ type: 'success', message: 'Podpis został zapisany' })
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas zapisywania podpisu' })
    }
  }

  const handleSignatureDelete = async () => {
    try {
      await deleteSignature.mutateAsync()
      addToast({ type: 'success', message: 'Podpis został usunięty' })
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas usuwania podpisu' })
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Ładowanie profilu..." />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-gray-500">
        Nie udało się załadować profilu
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            <ArrowLeft size={16} />
            Wróć
          </button>
          <h1 className="text-xl font-bold text-gray-900">Profil Firmy</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Dane używane w raportach PDF
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 active:scale-95'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Dane osobowe ──────────────────────────────────────────────── */}
      {activeTab === 'personal' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={18} className="text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">Dane osobowe</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Twoje dane wyświetlane w nagłówkach raportów
            </p>

            <Input
              label="Imię i nazwisko"
              required
              leftAddon={<User size={16} />}
              value={fullName}
              onChange={(e) => handleFieldChange(setFullName)(e.target.value)}
              placeholder="Jan Kowalski"
            />

            <Input
              label="Adres e-mail"
              type="email"
              disabled
              leftAddon={<Mail size={16} />}
              value={email}
              hint="E-mail powiązany z kontem — nie można zmienić"
            />

            <Input
              label="Telefon"
              type="tel"
              leftAddon={<Phone size={16} />}
              value={phone}
              onChange={(e) => handleFieldChange(setPhone)(e.target.value)}
              placeholder="+48 600 123 456"
            />
          </div>
        </Card>
      )}

      {/* ── Tab: Firma ─────────────────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={18} className="text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">Dane firmy</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Nazwa firmy na stronie tytułowej raportu
            </p>

            <Input
              label="Nazwa firmy"
              leftAddon={<Building2 size={16} />}
              value={companyName}
              onChange={(e) => handleFieldChange(setCompanyName)(e.target.value)}
              placeholder="Firma Inspekcyjna sp. z o.o."
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Wskazówka:</strong> Nazwa firmy pojawi się na stronach tytułowych raportów,
                obok Twojego imienia i nazwiska. Jeśli działasz jako osoba fizyczna,
                możesz zostawić to pole puste.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab: Uprawnienia ───────────────────────────────────────────────── */}
      {activeTab === 'certifications' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Award size={18} className="text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">Uprawnienia budowlane</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Wymagane w Protokołach Przeglądu (Art. 62 Prawa Budowlanego)
            </p>

            <Input
              label="Nr uprawnień budowlanych"
              leftAddon={<Hash size={16} />}
              value={licenseNumber}
              onChange={(e) => handleFieldChange(setLicenseNumber)(e.target.value)}
              placeholder="MAZ/0192/POOK/06"
              hint="Numer uprawnień do kontroli stanu technicznego obiektów budowlanych"
            />

            <Input
              label="Nr członkowski POIIB"
              leftAddon={<CreditCard size={16} />}
              value={poiibNumber}
              onChange={(e) => handleFieldChange(setPoiibNumber)(e.target.value)}
              placeholder="MAZ/BO/0001/06"
              hint="Polska Okręgowa Izba Inżynierów Budownictwa"
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Ważne:</strong> Numery uprawnień i POIIB są wymagane prawem w protokołach
                  z przeglądów okresowych budynków. Bez nich raport może być niekompletny.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab: Logo ──────────────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Image size={18} className="text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">Logo firmy</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Logo wyświetlane w nagłówku każdego raportu PDF
            </p>

            {/* Current logo or placeholder */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50">
              {profile.logo_url ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <img
                      src={profile.logo_url}
                      alt="Logo firmy"
                      className="max-h-24 max-w-[200px] object-contain rounded"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      loading={uploadLogo.isPending}
                    >
                      <Upload size={14} />
                      Zmień logo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogoDelete}
                      loading={deleteLogo.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Usuń
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto flex items-center justify-center">
                    <Image size={28} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Brak logo</p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG lub SVG, max 5 MB</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    loading={uploadLogo.isPending}
                  >
                    <Upload size={14} />
                    Wgraj logo
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Wskazówka:</strong> Najlepiej sprawdza się logo na przezroczystym tle (PNG)
                lub wektorowe (SVG). Zostanie wyświetlone w lewym górnym rogu raportu PDF.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab: Podpis ────────────────────────────────────────────────────── */}
      {activeTab === 'signature' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <PenTool size={18} className="text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">Podpis elektroniczny</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Twój podpis wstawiany automatycznie do raportów PDF
            </p>

            <SignaturePad
              label="Podpis inspektora"
              existingUrl={profile.signature_url}
              onSave={handleSignatureSave}
              onClear={handleSignatureDelete}
              height={180}
            />

            {(uploadSignature.isPending || deleteSignature.isPending) && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Spinner size="sm" />
                <span className="text-sm text-gray-500">
                  {uploadSignature.isPending ? 'Zapisywanie podpisu...' : 'Usuwanie podpisu...'}
                </span>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Wskazówka:</strong> Narysuj podpis palcem (mobile) lub myszą (desktop).
                Podpis jest zapisywany jednorazowo i wstawiany we wszystkie raporty.
                Podpis klienta zbierany jest osobno, przy każdej inspekcji.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Sticky save bar ────────────────────────────────────────────────── */}
      {['personal', 'company', 'certifications'].includes(activeTab) && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-area-bottom">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {isDirty ? (
                <span className="text-amber-600 font-medium">● Niezapisane zmiany</span>
              ) : (
                <span className="text-green-600">✓ Dane aktualne</span>
              )}
            </div>
            <Button
              onClick={handleSave}
              loading={updateProfile.isPending}
              disabled={!isDirty}
              size="sm"
            >
              <Save size={14} />
              Zapisz zmiany
            </Button>
          </div>
        </div>
      )}

      {/* ── Preview: how it looks in PDF ───────────────────────────────────── */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Podgląd — dane w raporcie PDF
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-3">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt="Logo"
                  className="h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <Image size={16} className="text-gray-400" />
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {fullName || <span className="text-gray-300">Brak imienia</span>}
                </div>
                {companyName && (
                  <div className="text-xs text-gray-500">{companyName}</div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-gray-400">E-mail:</span>{' '}
                <span className="text-gray-700">{email || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400">Telefon:</span>{' '}
                <span className="text-gray-700">{phone || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400">Nr uprawnień:</span>{' '}
                <span className="text-gray-700">{licenseNumber || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400">Nr POIIB:</span>{' '}
                <span className="text-gray-700">{poiibNumber || '—'}</span>
              </div>
            </div>

            {profile.signature_url && (
              <div className="border-t border-gray-200 pt-2">
                <span className="text-xs text-gray-400">Podpis: </span>
                <img
                  src={profile.signature_url}
                  alt="Podpis"
                  className="h-8 object-contain inline-block ml-2"
                />
              </div>
            )}
          </div>

          {/* Completeness check */}
          <div className="space-y-1">
            <CompletionItem ok={!!fullName} label="Imię i nazwisko" />
            <CompletionItem ok={!!phone} label="Telefon" />
            <CompletionItem ok={!!licenseNumber} label="Nr uprawnień budowlanych" important />
            <CompletionItem ok={!!poiibNumber} label="Nr członkowski POIIB" important />
            <CompletionItem ok={!!profile.logo_url} label="Logo firmy" />
            <CompletionItem ok={!!profile.signature_url} label="Podpis elektroniczny" important />
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function CompletionItem({ ok, label, important }: { ok: boolean; label: string; important?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={ok ? 'text-green-500' : important ? 'text-amber-500' : 'text-gray-300'}>
        {ok ? '✓' : important ? '⚠' : '○'}
      </span>
      <span className={ok ? 'text-gray-600' : important ? 'text-amber-600 font-medium' : 'text-gray-400'}>
        {label}
        {!ok && important && ' — wymagane w protokołach'}
      </span>
    </div>
  )
}
