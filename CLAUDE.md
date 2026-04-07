# InspekcjAI - Przewodnik Projektu

## Opis projektu

InspekcjAI to aplikacja mobilna (PWA → Google Play / iOS) do przeprowadzania inspekcji budowlanych i odbiorów. Inspektor wypełnia dane obiektu, robi zdjęcia usterek, rysuje po zdjęciach, zaznacza pinezki na planach, dyktuje notatki głosem — aplikacja generuje profesjonalny raport PDF.

**Wzorujemy się na:** [pocketinspections.com](https://pocketinspections.com/pl/)

## Stack technologiczny

- **Frontend:** React 19 + TypeScript + Vite (PWA)
- **Styling:** Tailwind CSS 3.4 z custom paletą primary (blue)
- **State:** Zustand (persisted auth, ephemeral UI)
- **Data fetching:** TanStack React Query
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router v7 (lazy-loaded)
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Icons:** Lucide React
- **Język UI:** Polski (plik i18n: `src/i18n/pl.ts`)
- **Path alias:** `@/` → `src/`

## Architektura folderów

```
src/
├── components/
│   ├── layout/      # AppLayout, Sidebar, MobileNav, InspectionNav, ProtectedRoute
│   ├── ui/          # Button, Input, Card, Badge, Modal, Toast, Spinner, EmptyState...
│   ├── photos/      # PhotoUploader, PhotoGrid, PhotoViewer, AnnotationCanvas
│   ├── floor-plans/ # FloorPlanUploader, FloorPlanViewer
│   ├── checklist/   # ChecklistSection, ChecklistItemRow
│   ├── signature/   # SignaturePad (canvas)
│   └── reports/     # TechnicalReport, TaskReport, ProtocolReport + shared/ + PDFStyles
├── config/          # constants.ts, supabase.ts
├── hooks/           # useAuth, useAuthInit, useInspections, useClients, useDefects,
│                    # usePhotos, useFloorPlans, usePins, useChecklist,
│                    # useProfile, useReports, useVoiceNotes
├── i18n/            # pl.ts
├── pages/
│   ├── auth/        # LoginPage, RegisterPage, OnboardingPage
│   ├── dashboard/   # DashboardPage
│   ├── inspections/ # wszystkie strony inspekcji (patrz tabela tras)
│   ├── clients/     # ClientsPage, NewClientPage, ClientDetailPage, EditClientPage
│   ├── reports/     # ReportsPage
│   └── settings/    # SettingsPage (placeholder), CompanyProfilePage
├── router/          # index.tsx, routePaths.ts
├── services/        # reportDataService.ts (agregacja danych do PDF)
└── types/           # database.types.ts, domain.ts
```

## Baza danych (Supabase)

Migracje w `supabase/migrations/`:
- `001_initial_schema.sql` — 12 tabel + triggery + pg_cron
- `002_rls.sql` — Row Level Security
- `003_storage.sql` — 5 bucketów (photos, floor-plans, voice-notes, report-pdfs, branding)
- `004_seed_checklists.sql` — szablony checklistów (roczny 27 el., piecioletni 38+ el.)
- `005_photo_annotations.sql` — pola annotacji zdjęć
- `006_v2_schema_updates.sql` — rozszerzone pola inspekcji (powierzchnia, kondygnacje, wnioski, ocena stanu), typy pól checklist, typ `polroczny`
- `007_v2_seed_checklists.sql` — seedy dla `polroczny` + przypisanie typów pól
- `008_playground_fields.sql` — specyficzne pola placu zabaw (urządzenia, nawierzchnia, ogrodzenie)

### Główne tabele
`profiles`, `companies`, `clients`, `inspections`, `defects`, `photos`, `floor_plans`, `pins`, `checklist_templates`, `checklist_items`, `voice_notes`, `reports`

## Typy inspekcji

| Typ | Opis | Checklist? | Podstawa prawna |
|-----|------|-----------|-----------------|
| `roczny` | Przegląd roczny budynku | TAK (27 el.) | Art. 62 ust. 1 pkt 1 PB |
| `piecioletni` | Przegląd 5-letni | TAK (38+ el.) | Art. 62 ust. 1 pkt 2 PB |
| `polroczny` | Przegląd półroczny | TAK | — |
| `plac_zabaw` | Przegląd placu zabaw | TAK (EN 1176/1177) | Normy EN |
| `odbior_mieszkania` | Odbiór domu/mieszkania od dewelopera | NIE | — |
| `ogolna` | Inspekcja ogólna | NIE | — |

## Struktura raportów PDF

Wzory w `docs/`: `raport ogolny.pdf` (42 str.), `raport zadan.pdf` (31 str.), `przykladowy_protokol_5 lat.pdf` (60 str.)

| Typ | Wzór | Dane |
|-----|------|------|
| `techniczny` | raport ogolny.pdf | defects + photos + pins + floor_plans + inspection + client + profile |
| `zadania` | raport zadan.pdf | j.w. + rozszerzone pola usterek (reporter, responsible, status, daty) |
| `protokol` | przykladowy_protokol_5 lat.pdf | checklist_items + inspection + profiles + photos |

Szczegółowa struktura każdego raportu opisana w `docs/` (wzory PDF).

## Workflow inspektora

```
1. Tworzenie inspekcji → wybór typu → dane obiektu → opcjonalnie klient
2. Upload planów/rzutów budynku (JPG/PDF)
3. [Jeśli checklist] Punkty kontrolne: stan + uwagi (tekst/głos) + zdjęcia
4. Dodawanie usterek: tytuł, opis, kategoria, severity, wykonawca, termin,
   zdjęcia z annotacjami, pinezka na planie
5. Dokumentacja budynku (roczny/piecioletni): status dokumentacji, zalecenia
6. Podpis inspektora + podpis klienta (canvas)
7. Generowanie raportu PDF → zapis + opcjonalna wysyłka mailem
```

## Funkcje AI

- **Głos → tekst profesjonalny:** Inspektor dyktuje potocznym językiem, AI zamienia na język techniczny (np. "ściana popękana i mokra" → "Stwierdzono zarysowania ściany z widocznymi śladami zawilgoceń")
- **Analiza zdjęć (przyszłość):** AI wykrywa usterki automatycznie
- **Implementacja:** OpenAI API przez Supabase Edge Function (`ai-proxy`) — komponent VoiceRecorder gotowy, Edge Function do implementacji

## Generowanie PDF

- **Technologia:** `@react-pdf/renderer` (client-side, zaimplementowane)
- **3 typy raportów:** techniczny, zadania, protokol — wszystkie gotowe
- **Branding:** Logo firmy, dane kontaktowe, certyfikaty (z CompanyProfilePage)
- **Numeracja:** Automatyczna (INS/2026/001)
- **Podpisy:** Elektroniczny podpis inspektora + podpis klienta (PNG z Storage)
- **Zdjęcia:** Z annotacjami, numerowane (Fot. 1, Fot. 2...), base64 w PDF

## Ekrany aplikacji

| Route | Ekran | Status |
|-------|-------|--------|
| `/login` | Logowanie | DONE |
| `/register` | Rejestracja | DONE |
| `/onboarding` | Wybór roli | DONE |
| `/` | Dashboard | DONE |
| `/inspections` | Lista inspekcji | DONE |
| `/inspections/new` | Nowa inspekcja (wizard 5 kroków) | DONE |
| `/inspections/:id` | Szczegóły inspekcji | DONE |
| `/inspections/:id/edit` | Edycja inspekcji (wizard) | DONE |
| `/inspections/:id/checklist` | Checklist punktów kontrolnych | DONE |
| `/inspections/:id/building-docs` | Dokumentacja budynku | DONE |
| `/inspections/:id/defects` | Lista usterek | DONE |
| `/inspections/:id/defects/new` | Nowa usterka | DONE |
| `/inspections/:id/defects/:defectId` | Szczegóły usterki | DONE |
| `/inspections/:id/defects/:defectId/edit` | Edycja usterki | DONE |
| `/inspections/:id/photos` | Galeria zdjęć | DONE |
| `/inspections/:id/photos/:photoId/annotate` | Rysowanie po zdjęciu | DONE |
| `/inspections/:id/floor-plans` | Zarządzanie planami z pinezkami | DONE |
| `/inspections/:id/signature` | Podpis klienta | DONE |
| `/inspections/:id/report` | Podgląd/generowanie raportu PDF | DONE |
| `/clients` | Lista klientów | DONE |
| `/clients/new` | Nowy klient | DONE |
| `/clients/:id` | Profil klienta + historia raportów | DONE |
| `/clients/:id/edit` | Edycja klienta | DONE |
| `/reports` | Wszystkie wygenerowane raporty | DONE |
| `/company-profile` | Profil, branding, certyfikaty, podpis | DONE |
| `/settings` | Ustawienia | PLACEHOLDER |
| `/subscription` | Plan subskrypcji | TODO |

## Konwencje kodu

- **Komponenty:** PascalCase, jeden plik = jeden komponent
- **Hooki:** `use` prefix, w `src/hooks/`
- **Store:** Zustand, w `src/store/`
- **Typy:** W `src/types/domain.ts` (business) i `database.types.ts` (Supabase)
- **Stałe:** W `src/config/constants.ts`
- **Tłumaczenia:** W `src/i18n/pl.ts`
- **UI komponenty:** `src/components/ui/` z eksportem z `index.ts`
- **Import:** Zawsze `@/` alias
- **Formularze:** React Hook Form + Zod schema
- **Queries:** TanStack React Query z `staleTime: 5min`
- **CSS:** Tailwind utility classes, `cn()` helper z `clsx` + `tailwind-merge`

## Plan subskrypcji

| Plan | Raporty/mies. | Cena |
|------|---------------|------|
| Free | 3 | 0 zł |
| Pro | bez limitu | TBD |
| Company | bez limitu + wielu inspektorów | TBD |

## Ważne uwagi

- **Offline:** Brak pełnego trybu offline, PWA cache'uje shell aplikacji
- **Podpisy:** Canvas do rysowania palcem, zapis PNG do bucketu `branding`
- **Token GitHub:** NIE commitować do repo

## Fazy rozwoju

- **FAZA 1** ✅ — Fundament (auth, layout, routing, DB schema, UI components)
- **FAZA 2** ✅ — CRUD inspekcji i klientów, formularze, listy, dashboard z danymi
- **FAZA 3** ✅ — Usterki, zdjęcia z annotacjami, plany z pinezkami, checklist, dokumentacja budynku, edycja rekordów
- **FAZA 4** 🔨 — PDF ✅ (3 typy raportów), AI głos→tekst ⬜ (VoiceRecorder gotowy, Edge Function do implementacji), analiza zdjęć AI ⬜
- **FAZA 5** — Subskrypcje (Stripe), settings/branding polish, CompanyProfile rozszerzenia
- **FAZA 6** — Google Play / iOS (Capacitor lub React Native)
