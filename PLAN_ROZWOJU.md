# InspekcjAI — Plan Rozwoju Aplikacji

> Dokument opisuje wszystkie fazy budowy aplikacji InspekcjAI.
> Każda faza zawiera konkretne zadania, pliki do stworzenia i kryteria akceptacji.
> Aktualizacja: 2026-03-26

---

## Legenda statusów

- ✅ DONE — ukończone
- 🔨 IN PROGRESS — w trakcie
- ⬜ TODO — do zrobienia
- 💡 NICE-TO-HAVE — opcjonalne, nie blokuje fazy

---

## FAZA 1 — Fundament ✅

> Auth, layout, routing, baza danych, komponenty UI

### 1.1 Projekt i konfiguracja ✅
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS 3.4 z custom paletą (primary blue)
- [x] Path alias `@/` → `src/`
- [x] ESLint + Prettier
- [x] PWA manifest + service worker (basic)
- [x] Struktura folderów (`components/`, `pages/`, `hooks/`, `store/`, `types/`, `i18n/`, `config/`, `router/`)

### 1.2 Supabase — schemat bazy danych ✅
- [x] `001_initial_schema.sql` — 12 tabel + triggery + pg_cron
- [x] `002_rls.sql` — Row Level Security
- [x] `003_storage.sql` — 5 bucketów (photos, floor-plans, voice-notes, report-pdfs, branding)
- [x] `004_seed_checklists.sql` — szablony checklistów + plany subskrypcji

### 1.3 Autentykacja ✅
- [x] Supabase Auth (email + password)
- [x] Zustand `authStore` z persystencją
- [x] `useAuth` hook
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
- [x] `i18n/pl.ts` — teksty po polsku

### 1.7 Dashboard ✅
- [x] Strona `/` z skeleton layoutem
- [x] Placeholder widgety (statystyki, ostatnie inspekcje)

---

## FAZA 2 — CRUD Inspekcji i Klientów ✅

> Formularze, listy, szczegóły — rdzeń aplikacji

### 2.1 Konfiguracja Supabase (wymagane przed CRUD) ✅
- [x] Utworzenie projektu Supabase (supabase.com)
- [x] Uruchomienie migracji SQL (001–004)
- [x] Wpisanie `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` do `.env.local`
- [x] Wygenerowanie typów: ręcznie z migracji SQL → `src/types/database.types.ts`
- [x] Test połączenia (login → profil)

### 2.2 Hooki i serwisy danych ✅
- [x] `src/hooks/useInspections.ts` — CRUD inspekcji (TanStack Query)
  - `useInspections()` — lista z filtrowaniem i sortowaniem
  - `useInspection(id)` — szczegóły jednej inspekcji
  - `useCreateInspection()` — mutation tworzenia
  - `useUpdateInspection()` — mutation aktualizacji
  - `useDeleteInspection()` — mutation usuwania
- [x] `src/hooks/useClients.ts` — CRUD klientów
  - `useClients()` — lista
  - `useClient(id)` — szczegóły + historia raportów
  - `useCreateClient()` — tworzenie
  - `useUpdateClient()` — aktualizacja
  - `useDeleteClient()` — usuwanie

### 2.3 Lista inspekcji — `/inspections` ✅
- [x] Strona z listą inspekcji (Card-based layout)
- [x] Filtry: typ inspekcji, status
- [x] Wyszukiwanie po nazwie/adresie
- [x] Przycisk "Nowa inspekcja" → `/inspections/new`
- [x] Każda karta pokazuje: nazwa, typ, adres, klient, data, status, liczba usterek
- [x] Kliknięcie → `/inspections/:id`
- [x] Empty state gdy brak inspekcji
- [ ] Swipe-to-delete lub menu kontekstowe (mobile) — 💡 nice-to-have
- [ ] Pull-to-refresh (mobile) — 💡 nice-to-have

### 2.4 Nowa inspekcja — `/inspections/new` (wizard wielokrokowy) ✅
- [x] **Krok 1 — Typ inspekcji:** wybór z kafelków (roczny, 5-letni, plac zabaw, odbiór mieszkania, ogólna), opis każdego typu, ikonka
- [x] **Krok 2 — Dane obiektu:** Nazwa, adres, miasto, rodzaj budynku, konstrukcja, rok budowy, piętro
- [x] **Krok 3 — Klient:** Wybór istniejącego (search) LUB quick-add nowego
- [x] **Krok 4 — Dodatkowe info (zależne od typu)**
- [x] **Krok 5 — Podsumowanie:** przegląd danych, przycisk "Utwórz inspekcję"
- [x] Walidacja Zod na każdym kroku
- [x] Pasek postępu (step indicator)
- [x] Możliwość cofnięcia się do poprzedniego kroku
- [x] Po utworzeniu → redirect do `/inspections/:id`

### 2.5 Szczegóły inspekcji — `/inspections/:id` ✅
- [x] **Nagłówek:** nazwa, typ (badge), status, adres
- [x] **Sekcja info:** dane obiektu, klient, daty
- [x] **Quick actions (kafelki/przyciski):** Checklist, Usterki, Zdjęcia, Plany, Raport, Podpis
- [x] **Przycisk usunięcia** z potwierdzeniem
- [ ] **Przycisk edycji** danych inspekcji — 💡 nice-to-have (Faza 3+)

### 2.6 Lista klientów — `/clients` ✅
- [x] Lista klientów (Card layout)
- [x] Wyszukiwanie po nazwisku / firmie
- [x] Każdy wpis: imię, email, telefon, liczba inspekcji
- [x] Kliknięcie w telefon → dzwonienie (tel: link)
- [x] Kliknięcie w adres → Google Maps
- [x] Kliknięcie w email → mailto:
- [x] Przycisk "Nowy klient"
- [x] Empty state

### 2.7 Nowy klient — `/clients/new` ✅
- [x] Formularz: imię, email, telefon, adres, notatki
- [x] Walidacja Zod (email format)
- [x] Po zapisie → redirect do `/clients/:id`

### 2.8 Profil klienta — `/clients/:id` ✅
- [x] Dane kontaktowe z klikalnymi linkami (tel, email, adres)
- [x] **Historia inspekcji:** lista inspekcji tego klienta
- [x] Przycisk usunięcia

### 2.9 Aktualizacja Dashboard — `/` ✅
- [x] Widgety z prawdziwymi danymi:
  - Łączna liczba inspekcji (aktywne / ukończone)
  - Ostatnie inspekcje (5 najnowszych → klik → szczegóły)
  - Klienci (liczba)
- [x] Szybkie akcje: "Nowa inspekcja", "Nowy klient"
- [x] Loading states i error handling

### Kryteria akceptacji FAZY 2:
- [x] Można utworzyć inspekcję każdego z 5 typów
- [x] Można dodać/edytować/usunąć klienta
- [x] Inspekcja jest powiązana z klientem
- [x] Dashboard pokazuje prawdziwe statystyki
- [x] Formularze mają pełną walidację
- [x] Działa na mobile i desktop
- [x] Dane zapisują się w Supabase

---

## FAZA 3 — Usterki, Zdjęcia, Plany, Checklist ✅

> Core workflow inspektora na miejscu

### 3.1 Upload planów budynku — `/inspections/:id/floor-plans`
- [x] Upload wielu planów (JPG, PNG)
- [x] Nadawanie nazwy planowi (np. "Parter", "Piętro 1", "Dach")
- [x] Podgląd miniatur wgranych planów
- [x] Usuwanie planu
- [x] Klik (mobile: klik)
- [ ] Drag & drop — 💡 nice-to-have
- [ ] PDF → konwersja na obraz — 💡 nice-to-have

### 3.2 Plan z pinezkami — `/inspections/:id/floor-plans`
- [x] Wyświetlanie planu z zoom + pan (pinch-to-zoom, react-zoom-pan-pinch)
- [x] Kliknięcie na plan → dodanie pinezki (tryb `pick`)
- [x] Pinezka = kolorowa kropka z numerem
- [x] Kolor pinezki = severity usterki (czerwona/pomarańczowa/żółta)
- [x] Kliknięcie w pinezkę → podgląd usterki (popup)
- [x] Pozycja pinezki zapisana jako % (x_percent, y_percent)
- [x] Lista pinezek pod planem z nawigacją do usterki
- [ ] Przesuwanie pinezki — 💡 nice-to-have

### 3.3 Lista usterek — `/inspections/:id/defects`
- [x] Lista wszystkich usterek tej inspekcji
- [x] Filtrowanie: kategoria, severity, status, typ
- [x] Sortowanie: numer, data, severity, status
- [x] Każda karta: #numer, tytuł, severity (badge), miniatura zdjęcia, status
- [x] Przycisk "Dodaj" + FAB na mobile
- [x] Kliknięcie → szczegóły usterki
- [x] Grupowanie wg kategorii

### 3.4 Nowa usterka — `/inspections/:id/defects/new`
- [x] Tytuł, opis
- [x] Kategoria (16 opcji + własna)
- [x] Typ zgłoszenia: Usterka, Uwaga, Zalecenie
- [x] Severity: Krytyczna, Poważna, Drobna
- [x] Status: Nowy, W trakcie, Zakończone
- [x] Wykonawca, osoba odpowiedzialna, termin naprawy
- [x] Lokalizacja na planie — wybór planu + kliknięcie → pinezka
- [x] Po zapisie → redirect do listy usterek
- [ ] Dyktafon → AI (Faza 4)

### 3.5 Zdjęcia z annotacjami
- [x] Galeria zdjęć `/inspections/:id/photos`
  - Siatka miniatur
  - Filtrowanie: wszystkie / usterki / checklist / luźne
  - Pełnoekranowy podgląd z nawigacją
- [x] Annotowanie `/inspections/:id/photos/:photoId/annotate`
  - Canvas overlay na zdjęciu
  - Wolne rysowanie
  - Wybór koloru (7 kolorów)
  - Wybór grubości linii (3 rozmiary)
  - Undo / Redo
  - Tekst (kliknięcie → prompt)
  - Zapis annotacji (JSONB) + composited image w Storage
- [x] Zdjęcia numerowane automatycznie (Fot. 1, Fot. 2, ...)
- [x] Upload zdjęć z aparatu (capture="environment")
- [x] Kompresja + miniaturki po stronie klienta

### 3.6 Checklist — `/inspections/:id/checklist`
- [x] Ładowanie szablonu na podstawie typu inspekcji
- [x] Przegląd roczny — 31 elementów w 4 sekcjach
- [x] Przegląd 5-letni — 38 elementów w 5 sekcjach (+ Instalacje)
- [x] Plac zabaw — 17 elementów w 3 sekcjach
- [x] Stan elementu: dobry / średni / dostateczny / nie dotyczy
- [x] Uwagi (textarea z debounce auto-save)
- [x] Zdjęcia referencyjne przy każdym elemencie
- [x] Progress bar (X/Y wypełnionych)
- [x] Zapis automatyczny (debounce 800ms)

### 3.7 Dokumentacja budynku — `/inspections/:id/building-docs`
- [x] Dostępna dla typów: roczny, pięcioletni
- [x] Dokumentacja budowy: kompletna / niekompletna / brak
- [x] Dokumentacja użytkowania: kompletna / niekompletna / brak
- [x] Książka obiektu budowlanego: prowadzona / niekompletna / brak
- [x] Zalecenia z poprzedniej kontroli (textarea)
- [x] Zakres wykonanych robót remontowych (textarea)
- [x] Zgłoszenia użytkowników lokali (textarea)
- [x] Zakres NIE wykonanych robót (textarea)
- [x] Zapis do bazy (update inspection)

### Kryteria akceptacji FAZY 3:
- [x] Inspektor może dodać usterkę z tytułem, opisem, kategorią, severity, zdjęciami
- [x] Zdjęcia można annotować (rysowanie palcem)
- [x] Plan budynku z pinezkami działa (zoom, klik, numery)
- [x] Checklist roczny i 5-letni jest kompletny wg prawa
- [x] Annotowane zdjęcia zapisują się poprawnie
- [x] Nawigacja między sekcjami inspekcji zawsze widoczna (sticky nav)
- [x] Dokumentacja budynku dla roczny/5-letni

---

## FAZA 4 — AI + Generowanie PDF ⬜

> "Efekt wow" — głos→tekst profesjonalny, automatyczny raport

### 4.1 Dyktafon — nagrywanie głosu
- [ ] Komponent `VoiceRecorder` (przycisk mikrofonu)
- [ ] Nagrywanie audio przez Web Audio API / MediaRecorder
- [ ] Wizualizacja fal dźwiękowych podczas nagrywania
- [ ] Przycisk stop → upload do Supabase Storage (bucket: voice-notes)
- [ ] Odtwarzanie nagrania (mini player)
- [ ] Zintegrowany w: opisy usterek, uwagi do checklisty, notatki

### 4.2 AI — Transkrypcja + Profesjonalizacja tekstu
- [ ] Supabase Edge Function: `ai-proxy`
  - Endpoint: `/transcribe` — Whisper API (audio → tekst surowy)
  - Endpoint: `/professionalize` — GPT-4o (tekst potoczny → tekst techniczny/formalny)
  - Endpoint: `/analyze-photo` (przyszłość — analiza zdjęć)
- [ ] Flow w aplikacji:
  1. Inspektor nagrywa głos
  2. Audio → Edge Function → Whisper → tekst surowy
  3. Tekst surowy → Edge Function → GPT-4o → tekst profesjonalny
  4. Wyświetlenie obu wersji (surowa + profesjonalna)
  5. Inspektor może wybrać wersję lub edytować
- [ ] Prompt GPT-4o zoptymalizowany pod język techniczny budowlany PL
- [ ] Obsługa błędów (brak internetu → zapisz audio, transkrybuj później)
- [ ] Wskaźnik "AI przetwarza..." (loading state)
- [ ] Zapisanie w bazie: `raw_transcription` + `professional_transcription`

### 4.3 Generowanie PDF — Raport TECHNICZNY
- [ ] Technologia: `@react-pdf/renderer` (client-side) lub Supabase Edge Function (server-side)
- [ ] **Strona tytułowa:**
  - Logo firmy (z Settings/branding)
  - Nazwa projektu
  - Adres obiektu
  - Klient (nazwa, firma)
  - Data inspekcji
  - Inspektor (imię, nazwisko, firma)
  - Liczba zgłoszeń
  - Zdjęcie obiektu (opcjonalnie)
- [ ] **Plan budynku z pinezkami** (per piętro/rzut):
  - Renderowanie planu z naniesionymi pinezkami (numery)
  - Legenda pinezek
- [ ] **Usterki pogrupowane wg KATEGORII:**
  - Nagłówek kategorii + liczba zgłoszeń
  - Dla każdej usterki:
    - `#numer` + tytuł
    - Tabela: Kategoria | Typ | Opis
    - Tabela: Wykonawca | Data zakończenia
    - Fragment planu z lokalizacją (crop wokół pinezki)
    - Zdjęcia annotowane (Fot. X, Fot. Y) — max 2 per wiersz
- [ ] **Dokumentacja fotograficzna** (ostatnia sekcja):
  - Wszystkie zdjęcia z numerami (Fot. 1 — Fot. N)
  - 2-4 zdjęcia na stronę
  - Podpis pod każdym zdjęciem

### 4.4 Generowanie PDF — Raport ZADAŃ
- [ ] Rozszerzenie raportu technicznego o:
  - **Strona tytułowa:** + Numer referencyjny, Inwestor, Generalny wykonawca, Dane kontaktowe inspektora, Data rozpoczęcia/zakończenia
  - **Zadania z rozszerzonym widokiem:**
    - UTWORZONO / OSTATNIA AKTUALIZACJA
    - TYP ZGŁOSZENIA
    - ZGŁASZAJĄCY (imię + firma)
    - ODPOWIEDZIALNY
    - WYKONAWCA
    - STATUS (Nowy / W trakcie / Zakończone) z badge kolorem
    - DATA ROZPOCZĘCIA / DATA ZAKOŃCZENIA
    - LOKALIZACJA (fragment planu z pinezką)
    - UWAGI
    - Zdjęcia

### 4.5 Generowanie PDF — Protokół PRZEGLĄDU
- [ ] Najbardziej złożony raport (wymagany prawem):
  - **Nagłówek formalno-prawny:** Nr protokołu, podstawa prawna, zakres, daty
  - **Osoba przeprowadzająca kontrolę:** dane inspektora + certyfikaty
  - **Informacje o budynku:** rodzaj, adres, zdjęcie, właściciel, administrator, konstrukcja
  - **Przegląd poprzedniej kontroli:** wnioski, roboty, zgłoszenia
  - **Dokumentacja budynku:** status kompletności
  - **Checklist elementów:** tabela z kolumnami: Element | Stan | Uwagi | Fot.
  - **Pokrycie dachowe:** tabela
  - **Urządzenia ppoż:** tabela
  - **Ochrona środowiska:** tabela
  - **Instalacje** (jeśli 5-letni): tabela
  - **Kryteria oceny:** legenda stanów
  - **Dokumentacja fotograficzna:** setki zdjęć z numeracją
  - **Podpisy:** inspektor + klient/zarządca (z canvas)

### 4.6 Podpis klienta — `/inspections/:id/signature`
- [ ] Canvas na pełnym ekranie (landscape na mobile)
- [ ] Rysowanie palcem / rysikiem
- [ ] Przycisk "Wyczyść" i "Zatwierdź"
- [ ] Podpis inspektora (z Settings — jednorazowe ustawienie)
- [ ] Podpis klienta (na każdą inspekcję)
- [ ] Zapisanie jako PNG → Supabase Storage
- [ ] Wstawienie do raportu PDF

### 4.7 Podgląd i wysyłka — `/inspections/:id/report`
- [ ] Wybór typu raportu (Techniczny / Zadań / Protokół przeglądu)
- [ ] Podgląd wygenerowanego PDF (in-app viewer)
- [ ] Przycisk "Pobierz PDF"
- [ ] Przycisk "Wyślij mailem" → modal z adresem email klienta
- [ ] Wysyłka przez Supabase Edge Function (Resend / SendGrid)
- [ ] Automatyczna numeracja: `INS/2026/001`
- [ ] Zapisanie PDF w Supabase Storage (bucket: report-pdfs)
- [ ] Historia wygenerowanych raportów

### Kryteria akceptacji FAZY 4:
- [ ] Dyktafon nagrywa i odtwarza głos
- [ ] AI zamienia mowę potoczną na profesjonalny tekst techniczny
- [ ] Raport Techniczny generuje się poprawnie z danymi inspekcji
- [ ] Raport Zadań generuje się poprawnie
- [ ] Protokół przeglądu jest zgodny z Prawem Budowlanym
- [ ] Podpisy (inspektor + klient) są w raporcie
- [ ] PDF można pobrać i wysłać mailem
- [ ] Zdjęcia w raporcie mają annotacje i numerację

---

## FAZA 5 — Settings, Branding, Subskrypcje ⬜

> Personalizacja, monetyzacja, profesjonalny wygląd

### 5.1 Settings — `/settings`
- [ ] **Dane osobowe:** imię, nazwisko, email, telefon
- [ ] **Dane firmy:** nazwa firmy, NIP, adres, strona www
- [ ] **Certyfikaty / uprawnienia:**
  - Nr uprawnień budowlanych
  - Nr członkowski POIIB (Polska Izba Inżynierów Budownictwa)
  - Specjalizacja
  - Upload skanów certyfikatów (opcjonalnie)
- [ ] **Branding:**
  - Upload logo firmy (wyświetlane na raportach)
  - Kolory firmowe (opcjonalnie — accent w raporcie)
- [ ] **Podpis elektroniczny:**
  - Canvas do narysowania podpisu
  - Podgląd zapisanego podpisu
  - Możliwość zmiany
- [ ] **Preferencje:**
  - Domyślny typ raportu
  - Domyślna numeracja (prefix)
  - Język (na przyszłość)

### 5.2 Subskrypcje — `/subscription`
- [ ] Wyświetlenie aktualnego planu (Free / Pro / Company)
- [ ] Porównanie planów:
  | | Free | Pro | Company |
  |---|---|---|---|
  | Raporty/miesiąc | 3 | ∞ | ∞ |
  | Inspektorzy | 1 | 1 | wielokrotni |
  | AI (głos→tekst) | ❌ | ✅ | ✅ |
  | Branding na raporcie | ❌ | ✅ | ✅ |
  | Priorytetowe wsparcie | ❌ | ❌ | ✅ |
- [ ] Integracja Stripe Checkout (płatności)
- [ ] Stripe webhooks → aktualizacja planu w Supabase
- [ ] Limit raportów — sprawdzanie przy generowaniu PDF
- [ ] Billing portal (zarządzanie subskrypcją, faktury)

### 5.3 Zarządzanie firmą (Company plan)
- [ ] Dodawanie inspektorów do firmy
- [ ] Przypisywanie inspekcji do inspektorów
- [ ] Wspólna baza klientów
- [ ] Dashboard firmy (statystyki wszystkich inspektorów)

### 5.4 Polish i UX
- [ ] Animacje przejść między stronami (Framer Motion)
- [ ] Skeleton loaders na listach
- [ ] Toasty (sukces/błąd) po każdej akcji
- [ ] Potwierdzenia usunięcia (modal)
- [ ] Responsywność — test na iPhone SE, iPhone 14, iPad, Desktop
- [ ] Dark mode (💡 nice-to-have)
- [ ] Onboarding tour dla nowych użytkowników (💡 nice-to-have)

### 5.5 Strona raportów — `/reports`
- [ ] Lista wszystkich wygenerowanych raportów
- [ ] Filtrowanie: typ raportu, inspekcja, klient, data
- [ ] Podgląd PDF
- [ ] Ponowne wysłanie mailem
- [ ] Pobranie PDF
- [ ] Usunięcie raportu

### Kryteria akceptacji FAZY 5:
- [ ] Inspektor może ustawić logo, certyfikaty, podpis — i widzi je w raportach
- [ ] Stripe działa (testowe płatności)
- [ ] Free plan limituje do 3 raportów
- [ ] Pro plan odblokowuje AI i branding
- [ ] Aplikacja jest dopracowana wizualnie

---

## FAZA 6 — Publikacja (Google Play / iOS) ⬜

> Z PWA na natywne aplikacje

### 6.1 Capacitor / TWA (Trusted Web Activity)
- [ ] Analiza: Capacitor vs TWA vs React Native
- [ ] Konfiguracja wybranego rozwiązania
- [ ] Dostęp do kamery (native)
- [ ] Dostęp do mikrofonu (native)
- [ ] Push notifications (Firebase)
- [ ] Deep linking

### 6.2 Google Play
- [ ] Konto dewelopera Google Play (25$ jednorazowo)
- [ ] Przygotowanie grafik: ikona, screenshots, feature graphic
- [ ] Opis sklepu (PL + EN)
- [ ] Privacy Policy
- [ ] Build APK/AAB
- [ ] Publikacja (internal testing → closed beta → production)

### 6.3 iOS / App Store
- [ ] Konto Apple Developer ($99/rok)
- [ ] Dostosowanie UI pod iOS guidelines
- [ ] Build IPA
- [ ] App Store Review (submission)
- [ ] Publikacja

### 6.4 CI/CD
- [ ] GitHub Actions: build + test na push
- [ ] Automatyczny deploy frontend (Vercel / Netlify)
- [ ] Automatyczny build mobile (Capacitor / EAS)

### Kryteria akceptacji FAZY 6:
- [ ] Aplikacja dostępna w Google Play
- [ ] Aplikacja dostępna w App Store
- [ ] Push notifications działają
- [ ] Kamera i mikrofon działają natywnie

---

## FAZA 7 — Rozwój i skalowanie (przyszłość) 💡

> Funkcje planowane po MVP

### 7.1 AI — Analiza zdjęć
- [ ] AI wykrywa usterki na zdjęciach w czasie rzeczywistym
- [ ] Sugestie kategorii i severity na podstawie zdjęcia
- [ ] Automatyczne zaznaczanie obszaru usterki

### 7.2 Porównanie przed/po
- [ ] Przy ponownej inspekcji — ładowanie usterek z poprzedniej
- [ ] Zdjęcie "przed" vs "po" obok siebie
- [ ] Status: naprawione / nie naprawione / częściowo

### 7.3 Nowe typy inspekcji przez użytkownika
- [ ] Kreator własnych typów inspekcji
- [ ] Własne pola w formularzu
- [ ] Własne szablony checklist
- [ ] Własne szablony raportów

### 7.4 Integracje
- [ ] Export do Excel (lista usterek)
- [ ] Integracja z Google Calendar (planowanie inspekcji)
- [ ] API dla firm (webhook przy nowym raporcie)
- [ ] Integracja z systemami zarządzania nieruchomościami

### 7.5 Wielojęzyczność
- [ ] Angielski, Niemiecki, Czeski, Słowacki
- [ ] Raporty w wielu językach

### 7.6 Dashboard zaawansowany
- [ ] Wykresy trendów (usterki w czasie)
- [ ] Mapa z lokalizacjami inspekcji
- [ ] Statystyki per inspektor (Company plan)

---

## Podsumowanie faz i szacowany czas

| Faza | Opis | Szacowany czas | Zależności |
|------|------|---------------|------------|
| **FAZA 1** ✅ | Fundament | ~1 tydzień | — |
| **FAZA 2** ✅ | CRUD inspekcji i klientów | ~2 tygodnie | Supabase projekt |
| **FAZA 3** ⬜ | Usterki, zdjęcia, plany, checklist | ~3 tygodnie | Faza 2 |
| **FAZA 4** ⬜ | AI + generowanie PDF | ~3 tygodnie | Faza 3 + OpenAI API key |
| **FAZA 5** ⬜ | Settings, branding, subskrypcje | ~2 tygodnie | Faza 4 + Stripe |
| **FAZA 6** ⬜ | Google Play / iOS | ~2 tygodnie | Faza 5 |
| **FAZA 7** 💡 | Rozwój | ongoing | Faza 6 |

**Łącznie do MVP (Fazy 1-5):** ~11 tygodni
**Łącznie do publikacji (Fazy 1-6):** ~13 tygodni

---

## Kolejność pracy (rekomendowana)

```
FAZA 2.1 → Konfiguracja Supabase (WYMAGANE PIERWSZE!)
FAZA 2.2 → Hooki danych
FAZA 2.3-2.4 → Inspekcje (lista + wizard)
FAZA 2.6-2.8 → Klienci
FAZA 2.5 → Szczegóły inspekcji
FAZA 2.9 → Dashboard z danymi
--- checkpoint: test na mobile ---
FAZA 3.1-3.2 → Plany + pinezki
FAZA 3.3-3.4 → Usterki
FAZA 3.5 → Zdjęcia + annotacje
FAZA 3.6 → Checklist
FAZA 3.7 → Dokumentacja budynku
--- checkpoint: pełny workflow inspektora ---
FAZA 4.1-4.2 → Dyktafon + AI
FAZA 4.3-4.5 → PDF raporty (techniczny → zadań → protokół)
FAZA 4.6-4.7 → Podpisy + wysyłka
--- checkpoint: aplikacja kompletna ---
FAZA 5 → Settings + Stripe + polish
FAZA 6 → Publikacja
```
