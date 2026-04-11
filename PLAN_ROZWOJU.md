# InspekcjAI — Plan Rozwoju Aplikacji

> Dokument opisuje wszystkie fazy budowy aplikacji InspekcjAI.
> Każda faza zawiera konkretne zadania, pliki do stworzenia i kryteria akceptacji.
> **Aktualizacja: 2026-04-10**

---

## Legenda statusów

- ✅ DONE — ukończone i zweryfikowane
- 🔨 IN PROGRESS — w trakcie bieżącego sprintu
- ⬜ TODO — do zrobienia (z planem implementacji)
- 💡 NICE-TO-HAVE — opcjonalne, nie blokuje fazy

---

## FAZA 1 — Fundament ✅

> Auth, layout, routing, baza danych, komponenty UI

### 1.1 Projekt i konfiguracja ✅
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS 3.4 z custom paletą (primary blue)
- [x] Path alias `@/` → `src/`
- [x] ESLint + Prettier
- [x] Struktura folderów (`components/`, `pages/`, `hooks/`, `store/`, `types/`, `i18n/`, `config/`, `router/`)

### 1.2 Supabase — schemat bazy danych ✅
- [x] `001_initial_schema.sql` — 12 tabel + triggery + pg_cron
- [x] `002_rls.sql` — Row Level Security
- [x] `003_storage.sql` — 5 bucketów (photos, floor-plans, voice-notes, report-pdfs, branding)
- [x] `004_seed_checklists.sql` — szablony checklistów + plany subskrypcji
- [x] `005_photo_annotations.sql` — pola annotacji
- [x] `006_v2_schema_updates.sql` — rozszerzone pola inspekcji, typ `polroczny`
- [x] `007_v2_seed_checklists.sql` — pełne seedy (roczny 45el, 5-letni 57el, plac_zabaw 83el)
- [x] `008_playground_fields.sql` — pola specyficzne dla placu zabaw
- [x] `009_owner_contact.sql` — pola kontaktowe właściciela
- [x] `010_pg_nazwa.sql` — pole `pg_nazwa` dla placu zabaw

### 1.3 Autentykacja ✅
- [x] Supabase Auth (email + password)
- [x] Zustand `authStore` z persystencją
- [x] `useAuth` hook (login, register, logout, updateProfile)
- [x] `ProtectedRoute` component
- [x] Strony: `/login`, `/register`, `/onboarding`
- [x] Onboarding — wybór roli (solo inspektor / firma)

### 1.4 Layout i nawigacja ✅
- [x] `AppLayout` z sidebar (desktop) + bottom nav (mobile)
- [x] `Sidebar` z menu items + logo
- [x] `MobileNav` z ikonami
- [x] React Router v7 z lazy-loaded routes
- [x] `routePaths.ts` z centralnymi ścieżkami

### 1.5 Komponenty UI ✅
- [x] Button, Input, Select, Textarea
- [x] Card, Badge, Modal, Toast
- [x] Spinner, EmptyState
- [x] `cn()` helper (clsx + tailwind-merge)
- [x] Export z `components/ui/index.ts`

### 1.6 Typy i konfiguracja ✅
- [x] `types/domain.ts` — pełne typy domeny
- [x] `config/constants.ts` — typy inspekcji, kategorie, severity, stany
- [x] `config/supabase.ts` — klient Supabase
- [x] `i18n/pl.ts` — teksty po polsku (plik istnieje, NIE zintegrowany z komponentami)

---

## FAZA 2 — CRUD Inspekcji i Klientów ✅

> Formularze, listy, szczegóły — rdzeń aplikacji

### 2.1–2.9 Wszystkie zadania ✅
- [x] `useInspections`, `useClients` hooki (pełny CRUD)
- [x] Lista inspekcji z filtrami i wyszukiwaniem
- [x] Wizard tworzenia inspekcji (5 kroków + walidacja Zod)
- [x] Szczegóły inspekcji z nawigacją `InspectionNav`
- [x] CRUD klientów (lista, szczegóły, edycja)
- [x] Dashboard z prawdziwymi danymi + quota bar
- [x] 6 typów inspekcji (roczny, 5-letni, półroczny, plac_zabaw, odbior_mieszkania, ogólna)

---

## FAZA 3 — Usterki, Zdjęcia, Plany, Checklist ✅

> Core workflow inspektora na miejscu

### 3.1–3.7 Wszystkie zadania ✅
- [x] Upload planów budynku z zoom + pan (react-zoom-pan-pinch)
- [x] Pinezki na planach (kolor = severity, popup z usterką)
- [x] CRUD usterek (16 kategorii, filtrowanie, sortowanie, grupowanie)
- [x] Galeria zdjęć z filtrami (usterki / checklist / luźne)
- [x] Annotacja zdjęć (canvas: rysowanie, kolory, grubości, undo/redo)
- [x] Checklisty auto-inicjalizowane z szablonów
- [x] Dyktafon + transkrypcja AI (Whisper) + profesjonalizacja (GPT-4o)
- [x] Dokumentacja budynku (zgodność z Prawem Budowlanym)
- [x] Podpisy (inspektor + klient, canvas, zapis PNG do Storage)

---

## FAZA 4 — AI + Generowanie PDF 🔨

> "Efekt wow" — głos→tekst profesjonalny, automatyczny raport

### 4.1 Dyktafon ✅
- [x] Komponent `VoiceRecorder` z dual-path (Web Speech API + MediaRecorder fallback)
- [x] Transkrypcja przez Whisper API (`ai-proxy` Edge Function)
- [x] Profesjonalizacja przez GPT-4o (prompt budowlany)
- [x] Zintegrowany w: opis usterki, uwagi checklist, dokumentacja budynku

### 4.2 Generowanie PDF ✅
- [x] `@react-pdf/renderer` (client-side)
- [x] Raport Techniczny (`TechnicalReport.tsx`)
- [x] Raport Zadań (`TaskReport.tsx`)
- [x] Protokół Przeglądu (`ProtocolReport.tsx`)
- [x] Wspólne komponenty: `CoverPage`, `SignatureSection`, `PageFooter`, `PDFStyles`
- [x] Branding: dane firmy, czcionki Roboto, paleta kolorów
- [x] Preflight checks przed generowaniem

### 4.3 Podpisy i raport ✅
- [x] Strona `/inspections/:id/signature`
- [x] Strona `/inspections/:id/report` z wyborem typu i progress indicator
- [x] Zapis PDF do Storage + rekord w tabeli `reports`
- [x] Historia raportów `/reports` (download, preview)

### 4.4 Wysyłka raportu emailem ⬜
**Pliki do stworzenia/modyfikacji:**
- `supabase/functions/send-report-email/index.ts` — Edge Function
- `src/hooks/useReports.ts` — dodać `useSendReport()` mutation
- `src/pages/inspections/ReportPage.tsx` — przycisk "Wyślij do klienta" + modal

**Plan implementacji:**
1. Edge Function (`send-report-email`):
   - Przyjmuje: `{ reportId, recipientEmail, message?, inspectorName }`
   - Waliduje JWT token (jak `ai-proxy`)
   - Pobiera signed URL do PDF z bucketu `report-pdfs` (czas: 7 dni)
   - Wysyła email przez Resend API z szablonem HTML
   - Zwraca `{ success: true }`
   - Zmienne środowiskowe: `RESEND_API_KEY` (już w `.env.local`)

2. Hook `useSendReport()`:
   ```ts
   mutationFn: async ({ reportId, recipientEmail, message }) => {
     // wywołanie Edge Function
     // po sukcesie: update reports SET sent_at, recipient_email
     // invalidate queries ['reports']
   }
   // onSuccess: promoteInspectionStatus(inspectionId, 'sent')
   ```

3. UI na `ReportPage.tsx`:
   - Przycisk "Wyślij do klienta" pojawia się po wygenerowaniu PDF
   - Modal z pre-wypełnionym emailem z `inspection.clients.email`
   - Pole wiadomości (opcjonalne)
   - Loading state i toast potwierdzający
   - Badge "Wysłany [data]" w `ReportsPage.tsx`

**Szablon emaila (HTML):**
- Logo firmy lub InspekcjAI logo
- "Raport inspekcji: [tytuł inspekcji]"
- Dane inspektora
- Przycisk "Pobierz raport PDF" → signed URL
- Stopka z danymi firmy

---

## FAZA 5 — Settings, Branding, Subskrypcje ⬜

> Personalizacja, monetyzacja, profesjonalny wygląd

### 5.1 Company Profile ✅ (już gotowe)
- [x] Dane firmy: nazwa, nr uprawnień, POIIB
- [x] Upload logo firmy
- [x] Podpis elektroniczny (canvas)
- [x] Podgląd PDF z brandingiem

### 5.2 Strona ustawień — `/settings` ⬜
**Route `SETTINGS_*` już zdefiniowane w `routePaths.ts`**

**Pliki do stworzenia:**
- `src/pages/settings/SettingsPage.tsx` — refactor z placeholdera na nawigację do podstron
- `src/pages/settings/ProfileSettingsPage.tsx` — dane osobowe
- `src/pages/settings/SecuritySettingsPage.tsx` — zmiana hasła

**Plan implementacji:**
1. `SettingsPage` → tabbed layout lub lista kart linkujących do podstron
2. `ProfileSettingsPage`:
   - Formularz: imię, nazwisko, telefon
   - Wywołuje `useAuth().updateProfile()`
3. `SecuritySettingsPage`:
   - Formularz zmiany hasła (obecne + nowe + potwierdź)
   - `supabase.auth.updateUser({ password: newPassword })`
   - Walidacja: min 8 znaków

### 5.3 Subskrypcja Stripe — `/subscription` ⬜
**Tabela `subscription_plans` i pola `stripe_*` w `profiles` już istnieją**

**Pliki do stworzenia:**
- `src/pages/subscription/SubscriptionPage.tsx`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/create-checkout-session/index.ts`

**Plan implementacji:**
1. `SubscriptionPage`:
   - Pobranie aktualnego planu z `profile.subscription_plan`
   - 3 karty: Free / Pro / Company z listą cech
   - Przycisk "Ulepsz" → Stripe Checkout
   - Przycisk "Zarządzaj subskrypcją" → Stripe Billing Portal

2. Edge Function `create-checkout-session`:
   - Tworzy Stripe Customer (jeśli brak `stripe_customer_id`)
   - Tworzy Checkout Session z `stripe_price_id` z tabeli `subscription_plans`
   - Zwraca `{ url }` → redirect na Stripe Checkout

3. Edge Function `stripe-webhook`:
   - Weryfikuje Stripe signature
   - Obsługuje eventy: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Aktualizuje `profiles.subscription_plan` + `stripe_subscription_id`

4. Middleware w `ReportPage` — sprawdza quota:
   ```ts
   if (profile.subscription_plan === 'free' &&
       profile.reports_used_this_month >= FREE_PLAN_REPORT_LIMIT) {
     // zablokuj generowanie, pokaż modal upgrade
   }
   ```

### 5.4 Zarządzanie zespołem ⬜ (Company plan)
**Pliki do stworzenia:**
- `src/pages/settings/TeamSettingsPage.tsx`

**Plan implementacji:**
- Lista inspektorów firmy (query `profiles WHERE company_id = user.company_id`)
- Formularz zaproszenia (email → Supabase invite)
- Usunięcie z firmy (update `company_id = null`)
- Route: `SETTINGS_TEAM`

---

## SPRINT PLAN — bieżący postęp 🔨

### Tydzień 1 (UKOŃCZONY ✅)

| Zadanie | Status | Pliki |
|---------|--------|-------|
| QW1: Ikony PWA (icon-192.png, icon-512.png) | ✅ | `public/icon-192.png`, `public/icon-512.png` |
| QW1: Odblokowanie Service Worker | ✅ | `src/main.tsx` (usunięty blok unregister) |
| QW1: Konfiguracja PWA z Workbox caching | ✅ | `vite.config.ts` (Supabase NetworkFirst/CacheFirst) |
| QW2: Error Boundary | ✅ | `src/components/ui/ErrorBoundary.tsx`, `src/App.tsx` |
| QW4: `.env.example` | ✅ | `.env.example` |
| QW4: `.npmrc` (legacy-peer-deps) | ✅ | `.npmrc` |
| INF2: CI/CD pipeline GitHub Actions | ✅ | `.github/workflows/ci.yml` |
| UX1: ForgotPasswordPage | ✅ | `src/pages/auth/ForgotPasswordPage.tsx` |
| UX1: ResetPasswordPage | ✅ | `src/pages/auth/ResetPasswordPage.tsx` |
| UX1: Link "Nie pamiętasz hasła?" w LoginPage | ✅ | `src/pages/auth/LoginPage.tsx` |
| UX1: Route FORGOT_PASSWORD + RESET_PASSWORD | ✅ | `src/router/routePaths.ts`, `src/router/index.tsx` |
| QW3: Helper `promoteInspectionStatus` | ✅ | `src/lib/inspectionStatus.ts` |
| QW3: Auto-status `in_progress` przy usterka/zdjęcie | ✅ | `src/hooks/useDefects.ts`, `src/hooks/usePhotos.ts` |
| QW3: Auto-status `completed` przy generowaniu raportu | ✅ | `src/hooks/useReports.ts` |
| QW3: Nowa inspekcja startuje jako `draft` | ✅ | `src/hooks/useInspections.ts` |

### Tydzień 2 (W TRAKCIE 🔨)

| Zadanie | Status | Priorytet |
|---------|--------|-----------|
| AF1: Wysyłka raportu emailem (Edge Function + UI) | ⬜ | 🔴 Wysoki |
| UX3: Wyszukiwanie/filtrowanie raportów | ⬜ | 🟡 Średni |
| AN1: Integracja telemetrii (PostHog/Plausible) | ⬜ | 🟡 Średni |

---

## BACKLOG — pomysły do kolejnych sprintów

### Quick Wins (< 2 dni każdy)

| ID | Pomysł | Pliki | Opis implementacji |
|----|--------|-------|-------------------|
| QW5 | Widget "Przeterminowane inspekcje" w Dashboard | `DashboardPage.tsx` | `useInspections` z filtrem `next_inspection_date < today`, nowa karta pod statystykami |
| QW6 | Pasek postępu na checkliście | `ChecklistPage.tsx` | `completedCount / totalCount` jako `<div>` progress bar na górze strony, dane już w `sections` |
| QW7 | Klonowanie inspekcji | `InspectionDetailPage.tsx` | Przycisk "Klonuj" → `useCreateInspection` z danymi budynku/klienta ze starej inspekcji |
| QW8 | Logo firmy w nagłówku PDF | `CoverPage.tsx` | `profile.logo_url` → base64 → `<Image>` w `CoverPage`, dane już dostępne w `ReportData` |
| QW9 | Podpis klienta → powiązanie z raportem | `useReports.ts`, `SignaturePage.tsx` | Po zapisie podpisu: `supabase.from('reports').update({ client_signature_url })` dla ostatniego raportu |

### UX Improvements (2-5 dni każdy)

| ID | Pomysł | Pliki | Opis implementacji |
|----|--------|-------|-------------------|
| UX2 | Strona ustawień (zmiana hasła, dane profilu) | `SettingsPage.tsx` (refactor) + 2 nowe podstrony | Patrz sekcja 5.2 powyżej |
| UX4 | Paginacja list | `useInspections.ts`, `useClients.ts`, `useDefects.ts` | `.range(page * PAGE_SIZE, (page+1) * PAGE_SIZE - 1)` + nowy komponent `Pagination` w `ui/` |
| UX5 | Filtrowanie i wyszukiwanie raportów | `ReportsPage.tsx` | Wzorzec skopiować z `InspectionsPage.tsx`: input search + dropdown typ raportu + reset |
| UX6 | Interaktywność dyktafonu (interimText) | `VoiceRecorder.tsx` | Wyświetlić `interimText` state pod przyciskiem nagrywania w czasie rzeczywistym |
| UX7 | Tryb tekstowy anotacji → modal zamiast prompt() | `PhotoAnnotatePage.tsx` | Zamienić `window.prompt()` na `<Modal>` z `<textarea>` i wyborem rozmiaru (używa istniejącego `Modal.tsx`) |
| UX8 | Pin → nawigacja do usterki | `FloorPlanViewer.tsx` | `onClick` na pinie → `navigate(buildPath(ROUTES.INSPECTION_DEFECT_DETAIL, {id, defectId}))` — `pin.defect_id` już w DB |

### Advanced Features (1-2 tygodnie)

| ID | Pomysł | Pliki | Opis implementacji |
|----|--------|-------|-------------------|
| AF2 | Subskrypcja Stripe | `SubscriptionPage.tsx` + 2 Edge Functions | Patrz sekcja 5.3 powyżej |
| AF3 | Tryb offline (PWA) | `vite.config.ts` (Workbox), `src/main.tsx` | SW skonfigurowany, potrzeba: IndexedDB queue dla operacji offline + banner "Brak połączenia" |
| AF4 | Harmonogram inspekcji (przypomnienia) | `DashboardPage.tsx` + migracja DB | Tabela `inspection_reminders`, pg_cron → wysyłka emaila, widget kalendarza |
| AF5 | Klonowanie/duplikowanie szablonów inspekcji | `NewInspectionPage.tsx` | Zakładka "Z szablonu" w kroku 1 wizarda, tabela `inspection_templates` |

### Infrastructure

| ID | Pomysł | Pliki | Opis implementacji |
|----|--------|-------|-------------------|
| INF1 | Framework testowy Vitest | `package.json`, `vitest.config.ts` | `npm i -D vitest @testing-library/react`, testy dla: `useInspections`, `inspectionStatus`, `buildPath` |
| INF3 | Naprawienie pre-existing błędów lint/TS | Wiele plików | `reportDataService.ts`, `ReportPage.tsx`, `Step3Client.tsx` — głównie błędy typowania `never` |

---

## FAZA 6 — Publikacja (Google Play / iOS) ⬜

### 6.1 PWA → Google Play (TWA)
- [ ] Weryfikacja PWA (Lighthouse ≥ 90) — częściowo gotowe (ikony ✅, SW ✅)
- [ ] `assetlinks.json` dla TWA (Digital Asset Links)
- [ ] Bubblewrap CLI — generowanie projektu Android
- [ ] Ikony: 512px maskable (✅), splash screen
- [ ] Build APK/AAB + podpisanie
- [ ] Publikacja: internal testing → production

### 6.2 iOS (PWA jako WebApp)
- [ ] `apple-touch-icon` w `vite.config.ts` (już placeholder)
- [ ] `apple-mobile-web-app-capable` meta tagi
- [ ] Splash screeny dla wszystkich rozmiarów iPhone

### 6.3 CI/CD rozszerzenie
- [ ] Deploy na Vercel/Netlify (dodać step w `ci.yml`)
- [ ] Supabase migrations auto-apply na merge do main
- [ ] Lighthouse CI w pipeline

---

## FAZA 7 — Rozwój i skalowanie 💡

> Funkcje planowane po MVP

- [ ] **AI analiza zdjęć** — wykrywanie usterek na zdjęciach (GPT-4o Vision)
- [ ] **Porównanie przed/po** — przy ponownej inspekcji
- [ ] **Kreator własnych typów inspekcji** — drag-and-drop form builder
- [ ] **Export CSV/Excel** — lista usterek do pobrania
- [ ] **Integracja Google Calendar** — planowanie inspekcji
- [ ] **Dashboard analityczny** — wykresy trendów usterek w czasie
- [ ] **Wielojęzyczność** — integracja `pl.ts` + EN/DE (plik i18n już istnieje)
- [ ] **Zarządzanie zespołem w czasie rzeczywistym** — wspólna baza + przypisywanie

---

## Stan plików — co gdzie znaleźć

### Nowe pliki dodane w bieżącym sprincie
| Plik | Opis |
|------|------|
| `public/icon-192.png` | Ikona PWA 192×192 (z favicon.svg) |
| `public/icon-512.png` | Ikona PWA 512×512 (z favicon.svg) |
| `.env.example` | Zmienne środowiskowe bez wartości |
| `.npmrc` | `legacy-peer-deps=true` (fix vite-plugin-pwa vs Vite 8) |
| `.github/workflows/ci.yml` | CI: lint + typecheck + build |
| `src/components/ui/ErrorBoundary.tsx` | React Error Boundary z ekranem błędu |
| `src/pages/auth/ForgotPasswordPage.tsx` | Formularz "zapomniałem hasła" |
| `src/pages/auth/ResetPasswordPage.tsx` | Formularz ustawienia nowego hasła |
| `src/lib/inspectionStatus.ts` | Helper `promoteInspectionStatus()` |

### Kluczowe pre-existing błędy TypeScript (do naprawy w INF3)
| Plik | Problem |
|------|---------|
| `src/services/reportDataService.ts` | Typ `never` przy `inspection.clients`, `inspection.photos` itp. |
| `src/pages/inspections/ReportPage.tsx` | Typ `never` przy `inspection.title`, `inspection.type` |
| `src/pages/inspections/SignaturePage.tsx` | `inspectionId` prop nieznany |
| `src/pages/inspections/wizard/Step3Client.tsx` | Typ `never` przy `clients` |
| `src/pages/reports/ReportsPage.tsx` | `$$typeof` w typie ikony Lucide |

### Puste katalogi (Edge Functions do implementacji)
| Katalog | Co zaimplementować |
|---------|-------------------|
| `supabase/functions/send-report-email/` | Wysyłka PDF emailem przez Resend |
| `supabase/functions/generate-report-number/` | Generowanie `INS/2026/001` (teraz DB RPC + fallback klient) |

---

## Podsumowanie faz

| Faza | Opis | Status |
|------|------|--------|
| **FAZA 1** | Fundament | ✅ DONE |
| **FAZA 2** | CRUD inspekcji i klientów | ✅ DONE |
| **FAZA 3** | Usterki, zdjęcia, plany, checklist | ✅ DONE |
| **FAZA 4** | AI + generowanie PDF | 🔨 95% (brakuje: wysyłka email) |
| **FAZA 5** | Settings, branding, subskrypcje | 🔨 30% (CompanyProfile ✅, reszta ⬜) |
| **FAZA 6** | Google Play / iOS | ⬜ PWA gotowa do testów |
| **FAZA 7** | Rozwój | 💡 Po MVP |

**Pozostałe do "zamknięcia" MVP:**
1. **Wysyłka raportu emailem** (AF1) — zamknięcie cyklu inspekcji
2. **Subskrypcja Stripe** (AF2) — monetyzacja
3. **Strona ustawień** (UX2) — zmiana hasła, dane profilu

**Szybkie zwycięstwa (każde < 2h pracy):**
- Logo firmy w PDF (QW8)
- Pasek postępu checklisty (QW6)
- Widget przeterminowanych inspekcji (QW5)
- Pin → nawigacja do usterki (UX8)
- Podpis klienta → powiązanie z raportem (QW9)
