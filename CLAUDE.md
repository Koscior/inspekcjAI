# InspekcjAI - Przewodnik Projektu

## Opis projektu

InspekcjAI to aplikacja mobilna (PWA → Google Play / iOS) do przeprowadzania inspekcji budowlanych i odbiorów. Inspektor na miejscu wypełnia dane obiektu, robi zdjęcia usterek, rysuje po zdjęciach, zaznacza pinezki na planach budynku, dyktuje notatki głosem — a na koniec aplikacja automatycznie generuje profesjonalny raport PDF.

**Wzorujemy się na:** [pocketinspections.com](https://pocketinspections.com/pl/) — nie kopiujemy 1:1, ale bazujemy na workflow i funkcjonalności, z własnym designem i ulepszeniami (AI).

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
├── assets/          # Obrazy, SVG
├── components/
│   ├── layout/      # AppLayout, Sidebar, MobileNav, ProtectedRoute
│   ├── ui/          # Button, Input, Card, Badge, Modal, Toast, Spinner, EmptyState...
│   ├── photos/      # PhotoUploader, PhotoGrid, PhotoViewer, AnnotationCanvas
│   ├── floor-plans/ # FloorPlanUploader, FloorPlanViewer
│   └── checklist/   # ChecklistSection, ChecklistItemRow
├── config/
│   ├── constants.ts # Typy inspekcji, kategorie usterek, severity, stany
│   └── supabase.ts  # Klient Supabase
├── hooks/           # useAuth, useAuthInit, useInspections, useClients, useDefects, usePhotos, useFloorPlans, usePins, useChecklist
├── i18n/            # pl.ts - wszystkie teksty po polsku
├── pages/
│   ├── auth/        # LoginPage, RegisterPage, OnboardingPage
│   ├── dashboard/   # DashboardPage
│   ├── inspections/ # InspectionsPage, NewInspectionPage, InspectionDetailPage, DefectsPage, NewDefectPage, DefectDetailPage, FloorPlansPage, PhotosPage, PhotoAnnotatePage, ChecklistPage
│   └── clients/     # ClientsPage, NewClientPage, ClientDetailPage
├── router/          # index.tsx (routes), routePaths.ts
├── store/           # authStore.ts, uiStore.ts
└── types/
    ├── database.types.ts  # Typy Supabase (do wygenerowania)
    └── domain.ts          # Pełne typy domeny (Profile, Inspection, Defect...)
docs/                # Wzory raportów PDF (raport ogolny.pdf, raport zadan.pdf, przykladowy_protokol_5 lat.pdf)
```

## Baza danych (Supabase)

Migracje w `supabase/migrations/`:
- `001_initial_schema.sql` — 12 tabel + triggery + pg_cron
- `002_rls.sql` — Row Level Security na wszystkie tabele
- `003_storage.sql` — 5 bucketów (photos, floor-plans, voice-notes, report-pdfs, branding)
- `004_seed_checklists.sql` — Szablony checklistów wg Prawa Budowlanego + plany subskrypcji

### Główne tabele
- `profiles` — dane inspektora, certyfikaty, logo, podpis, plan subskrypcji
- `companies` — firmy inspektorskie
- `clients` — klienci z danymi kontaktowymi
- `inspections` — inspekcje z pełnymi metadanymi budynku
- `defects` — usterki z klasyfikacją (severity, category, type, status)
- `photos` — zdjęcia z annotacjami i analizą AI (JSONB)
- `floor_plans` — plany/rzuty budynku (wiele per inspekcja)
- `pins` — pinezki na planach (x_percent, y_percent, label_number)
- `checklist_templates` — szablony wymagane prawem (seedy w 004)
- `checklist_items` — wypełnione punkty kontrolne
- `voice_notes` — notatki głosowe z transkrypcją (raw + professional)
- `reports` — wygenerowane raporty (PDF path, podpisy, numeracja)

## Typy inspekcji

| Typ | Opis | Checklist? | Podstawa prawna |
|-----|------|-----------|-----------------|
| `roczny` | Przegląd roczny budynku | TAK (27+ elementów) | Art. 62 ust. 1 pkt 1 PB |
| `piecioletni` | Przegląd 5-letni | TAK (rozszerzony o instalacje) | Art. 62 ust. 1 pkt 2 PB |
| `plac_zabaw` | Przegląd placu zabaw | TAK (EN 1176/1177) | Normy EN |
| `odbior_mieszkania` | Odbiór domu/mieszkania od dewelopera | NIE (opcjonalnie) | — |
| `ogolna` | Inspekcja ogólna | NIE | — |

## Struktura raportów (KLUCZOWE — zweryfikowane na wzorach z `docs/`)

Wzory w `docs/`: `raport ogolny.pdf` (42 str.), `raport zadan.pdf` (31 str.), `przykladowy_protokol_5 lat.pdf` (60 str.)

### Raport TECHNICZNY (typ: `techniczny`) — wzór: `raport ogolny.pdf`
Dane z: `defects`, `photos`, `floor_plans`, `pins`, `inspection`, `clients`, `profiles`
1. **Strona tytułowa:** Projekt, Adres, Klient, Data, Utworzył, "ZGŁOSZEŃ: N"
2. **Plan budynku** z pinezkami (kolorowe wg severity, numerowane)
3. **Usterki pogrupowane wg KATEGORII** (nagłówek: "KATEGORIA — ZGŁOSZEŃ: N"):
   - `#numer` + tytuł
   - Kategoria | Typ (Usterka/Zadanie/Uwaga) | Dodatkowy opis (`defects.description`)
   - Wykonawca (`defects.contractor`) | Data zakończenia (`defects.deadline`)
   - Fragment planu z lokalizacją pinezki
   - Zdjęcia (Fot. N, Fot. N+1) — annotowane, 2 obok siebie
4. **Dokumentacja fotograficzna** — "LICZBA ZDJĘĆ: N", po 1 zdjęciu na stronę z "Fot. N"

### Raport ZADAŃ (typ: `zadania`) — wzór: `raport zadan.pdf`
Dane z: jak techniczny + rozszerzone pola defects + dane inspektora
1. **Strona tytułowa rozszerzona:**
   - Projekt, Adres, NUMER REFERENCYJNY (`inspection.reference_number`)
   - INWESTOR (`inspection.investor_name`)
   - UTWORZYŁ: imię (`profiles.full_name`) + email + telefon
   - GENERALNY WYKONAWCA (`inspection.contractor_name`)
   - DATA ROZPOCZĘCIA / DATA ZAKOŃCZENIA
   - "ZGŁOSZEŃ: N"
2. **Plan budynku** z pinezkami
3. **Zadania pogrupowane wg KATEGORII** (nagłówek + count):
   - `#numer` + tytuł + kategoria (inline)
   - UTWORZONO (`defects.created_at`) | OSTATNIA AKTUALIZACJA (`defects.updated_at`)
   - TYP ZGŁOSZENIA (`defects.type`)
   - ZGŁASZAJĄCY (`defects.reporter_name` + firma) | ODPOWIEDZIALNY (`defects.responsible_person`)
   - WYKONAWCA (`defects.contractor`)
   - STATUS (`defects.status`: Nowy/W trakcie/Zakończone)
   - DATA ROZPOCZĘCIA | DATA ZAKOŃCZENIA (`defects.deadline`)
   - LOKALIZACJA (fragment planu) | UWAGI (`defects.description`)
   - Zdjęcia (Fot. N, Fot. N+1)
4. **Dokumentacja fotograficzna** — po 2 zdjęcia na stronę

### Protokół PRZEGLĄDU (typ: `protokol`) — wzór: `przykladowy_protokol_5 lat.pdf`
Dane z: `checklist_items`, `checklist_templates`, `inspection`, `profiles`, `photos`
1. **Nagłówek formalno-prawny:**
   - PROTOKÓŁ nr (`inspection.reference_number`)
   - Podstawa prawna (Art. 62 ust. 1 pkt 1a/1b PB + Rozporządzenie)
   - ZAKRES KONTROLI (3 punkty ustawowe)
   - Data kontroli (`inspection.inspection_date`) / Data następnej (`inspection.next_inspection_date`)
2. **Osoba przeprowadzająca kontrolę:** (`profiles.*`)
   - Imię i nazwisko, firma, Nr uprawnień, Nr POIIB, Telefon, E-mail
3. **Informacje o budynku:** (`inspection.*`)
   - Rodzaj budynku, Adres, Właściciel, Administrator, Rodzaj konstrukcji
4. **Przegląd poprzedniej kontroli:** (`inspection.*`)
   - Zalecenia z poprzedniej kontroli (`previous_protocol_notes`) — numerowana lista
   - Zgłoszenia użytkowników (`tenant_complaints`)
   - Zakres niewykonanych robót (`incomplete_works`)
5. **Dokumentacja budynku:** (`inspection.*`)
   - Dokumentacja budowy: kompletna/niekompletna/brak (`building_docs_status`)
   - Dokumentacja użytkowania (`usage_docs_status`)
   - Książka obiektu (`building_log_status`)
6. **CHECKLIST ELEMENTÓW** (`checklist_items.*`) — per sekcja:
   - NAZWA → STAN (Dobry/Średni/Dostateczny/Nie dotyczy) → UWAGI (numerowane) → Fot. refs
   - Sekcje: PODSTAWOWE ELEMENTY BUDYNKU, URZĄDZENIA ZAMOCOWANE, POKRYCIE DACHOWE, ZABEZPIECZENIE PPOŻ, INSTALACJE (tylko pięcioletni)
7. **STWIERDZONE USZKODZENIA** zagrażające życiu (z usterek critical)
8. **WNIOSKI KOŃCOWE** (zalecenia + ocena stanu technicznego)
9. **Podpisy:** inspektor + klient/zarządca
10. **Dokumentacja fotograficzna** — 6 zdjęć na stronę z "Fot. N"

## Workflow inspektora w aplikacji

```
1. Tworzenie inspekcji → wybór typu → dane obiektu
2. Upload planów/rzutów budynku (JPG/PDF, wiele per inspekcja)
3. [Jeśli checklist] Przechodzenie przez punkty kontrolne:
   - Zaznaczanie stanu (dobry/średni/dostateczny/nie dotyczy)
   - Opis uwag (tekst lub dyktafon → AI poprawia na profesjonalny)
   - Zdjęcia referencyjne
4. Dodawanie usterek/uwag:
   - Tytuł, opis (tekst/głos → AI)
   - Kategoria, typ, severity
   - Wykonawca, termin
   - Zdjęcia z annotacjami (rysowanie po zdjęciu, kolory)
   - Pinezka na planie budynku (mała kropka z numerkiem)
5. Podpis klienta (palcem po ekranie)
6. Generowanie raportu PDF → wysyłka mailem
```

## Funkcje AI

- **Transkrypcja głosu → tekst profesjonalny:** Inspektor dyktuje potocznym językiem, AI zamienia na język techniczny/formalny (np. "tu ściana popękana i mokra" → "Stwierdzono zarysowania ściany z widocznymi śladami zawilgoceń")
- **Analiza zdjęć (przyszłość):** AI wykrywa usterki na zdjęciach podczas robienia zdjęć
- **Implementacja:** OpenAI API przez Supabase Edge Function (ai-proxy)

## Generowanie PDF

Raporty muszą wyglądać profesjonalnie i być zgodne z prawem. Kluczowe wymagania:
- **Branding:** Logo firmy, dane kontaktowe, certyfikaty (z sekcji Settings)
- **Numeracja:** Automatyczna (np. INS/2026/001)
- **Podpisy:** Elektroniczny podpis inspektora + podpis klienta
- **Zdjęcia:** Z annotacjami, numerowane (Fot. 1, Fot. 2...)
- **Plany:** Z pinezkami usterek
- **Technologia:** `@react-pdf/renderer` lub server-side w Edge Function

## Ekrany aplikacji (route paths)

| Route | Ekran | Status |
|-------|-------|--------|
| `/login` | Logowanie | DONE |
| `/register` | Rejestracja | DONE |
| `/onboarding` | Wybór roli (solo/firma) | DONE |
| `/` | Dashboard | DONE (skeleton) |
| `/inspections` | Lista inspekcji | DONE (Faza 2) |
| `/inspections/new` | Nowa inspekcja (wizard) | DONE (Faza 2) |
| `/inspections/:id` | Szczegóły inspekcji | DONE (Faza 2) |
| `/inspections/:id/checklist` | Checklist punktów kontrolnych | TODO (Faza 3) |
| `/inspections/:id/defects` | Lista usterek | TODO (Faza 3) |
| `/inspections/:id/defects/new` | Nowa usterka | TODO (Faza 3) |
| `/inspections/:id/defects/:defectId` | Szczegóły usterki | TODO (Faza 3) |
| `/inspections/:id/photos` | Galeria zdjęć | TODO (Faza 3) |
| `/inspections/:id/photos/:photoId/annotate` | Rysowanie po zdjęciu | TODO (Faza 3) |
| `/inspections/:id/floor-plans` | Zarządzanie planami | TODO (Faza 3) |
| `/inspections/:id/report` | Podgląd/generowanie raportu | TODO (Faza 4) |
| `/inspections/:id/signature` | Podpis klienta | TODO (Faza 4) |
| `/clients` | Lista klientów | DONE (Faza 2) |
| `/clients/new` | Nowy klient | DONE (Faza 2) |
| `/clients/:id` | Profil klienta + historia raportów | DONE (Faza 2) |
| `/reports` | Wszystkie raporty | TODO (Faza 4) |
| `/settings` | Profil, branding, certyfikaty, podpis | TODO (Faza 5) |
| `/subscription` | Plan subskrypcji | TODO (Faza 5) |

## Konwencje kodu

- **Komponenty:** PascalCase, jeden plik = jeden komponent
- **Hooki:** `use` prefix, w `src/hooks/`
- **Store:** Zustand, w `src/store/`
- **Typy:** W `src/types/domain.ts` (business) i `database.types.ts` (Supabase)
- **Stałe:** W `src/config/constants.ts`
- **Tłumaczenia:** W `src/i18n/pl.ts`
- **UI komponenty:** `src/components/ui/` z eksportem z `index.ts`
- **Import:** Zawsze `@/` alias (nie relative paths z `../../`)
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

- **Offline:** Nie implementujemy pełnego trybu offline (ryzyko komplikacji), ale PWA cache'uje shell aplikacji
- **Porównanie przed/po:** Planowane na przyszłość, nie w MVP
- **Nowe typy inspekcji przez użytkownika:** Nie w MVP, tylko wbudowane typy
- **Podpisy:** Prosty canvas do rysowania palcem po ekranie
- **Status inspekcji:** Draft → In Progress → Completed → Sent (nice-to-have, nie krytyczny)
- **Klienci:** Sekcja z danymi kontaktowymi (klik → telefon/Google Maps), historia raportów
- **Token GitHub:** NIE commitować do repo (użyć `.gitignore` lub zmiennych środowiskowych)

## Fazy rozwoju

- **FAZA 1** ✅ — Fundament (auth, layout, routing, DB schema, UI components)
- **FAZA 2** ✅ — CRUD inspekcji i klientów, formularze, listy, dashboard z danymi
- **FAZA 3** 🔨 — Usterki, zdjęcia z annotacjami, plany z pinezkami, checklist, dokumentacja budynku
- **FAZA 4** — AI (głos→tekst, analiza zdjęć), generowanie PDF (3 typy raportów)
- **FAZA 5** — Subskrypcje (Stripe), settings/branding, polish
- **FAZA 6** — Google Play / iOS (Capacitor lub React Native)

## Wzory raportów PDF

Prawdziwe wzory raportów w `docs/`:
- `raport ogolny.pdf` — Raport Techniczny (42 str., 12 usterek w 5 kategoriach, 22 zdjęcia)
- `raport zadan.pdf` — Raport Zadań (31 str., rozszerzone pola: zgłaszający, status, daty)
- `przykladowy_protokol_5 lat.pdf` — Protokół Przeglądu (60 str., pełny checklist, dokumentacja, ~270 zdjęć)
