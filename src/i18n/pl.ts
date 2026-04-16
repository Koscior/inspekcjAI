export const pl = {
  // Auth
  auth: {
    login: 'Zaloguj się',
    register: 'Zarejestruj się',
    logout: 'Wyloguj się',
    email: 'Adres e-mail',
    password: 'Hasło',
    confirmPassword: 'Potwierdź hasło',
    forgotPassword: 'Nie pamiętasz hasła?',
    noAccount: 'Nie masz konta?',
    hasAccount: 'Masz już konto?',
    fullName: 'Imię i nazwisko',
    loginError: 'Błędny e-mail lub hasło',
    registerSuccess: 'Konto zostało utworzone',
  },

  // Onboarding
  onboarding: {
    title: 'Jak będziesz korzystać z InspekcjAI?',
    solo: 'Inspektor niezależny',
    soloDesc: 'Pracuję samodzielnie',
    company: 'Firma inspektorska',
    companyDesc: 'Zarządzam zespołem inspektorów',
    continue: 'Kontynuuj',
  },

  // Navigation
  nav: {
    dashboard:   'Panel główny',
    inspections: 'Inspekcje',
    clients:     'Klienci',
    reports:     'Raporty',
    settings:    'Ustawienia',
    subscription:'Subskrypcja',
  },

  // Dashboard
  dashboard: {
    title: 'Panel główny',
    thisMonth: 'Ten miesiąc',
    totalInspections: 'Inspekcje',
    totalClients: 'Klienci',
    reportsGenerated: 'Raporty',
    recentInspections: 'Ostatnie inspekcje',
    noInspections: 'Brak inspekcji',
    startFirst: 'Utwórz pierwszą inspekcję',
    reportsUsed: 'Wykorzystane raporty',
    upgradePlan: 'Ulepsz plan',
  },

  // Inspections
  inspections: {
    title: 'Inspekcje',
    new: 'Nowa inspekcja',
    selectType: 'Wybierz typ inspekcji',
    selectClient: 'Wybierz klienta',
    details: 'Szczegóły inspekcji',
    checklist: 'Checklista',
    address: 'Adres obiektu',
    date: 'Data inspekcji',
    nextDate: 'Data następnej kontroli',
    buildingType: 'Rodzaj budynku',
    constructionType: 'Rodzaj konstrukcji',
    owner: 'Właściciel nieruchomości',
    manager: 'Administrator nieruchomości',
    investor: 'Inwestor',
    contractor: 'Generalny wykonawca',
    referenceNumber: 'Numer referencyjny',
    tabs: {
      info:      'Informacje',
      defects:   'Usterki',
      floorPlans:'Rzuty',
      photos:    'Zdjęcia',
      checklist: 'Checklista',
      report:    'Raport',
      documents: 'Dokumenty',
      plans:     'Plany',
      more:      'Więcej',
    },
  },

  // Defects
  defects: {
    title: 'Usterki',
    add: 'Dodaj usterkę',
    noDefects: 'Brak usterek',
    defectTitle: 'Tytuł usterki',
    description: 'Opis',
    category: 'Kategoria',
    type: 'Typ',
    severity: 'Ważność',
    contractor: 'Wykonawca',
    deadline: 'Termin realizacji',
    location: 'Lokalizacja',
    notes: 'Uwagi',
    reporter: 'Zgłaszający',
    responsible: 'Odpowiedzialny',
    status: {
      open: 'Otwarte',
      in_progress: 'W trakcie',
      closed: 'Zamknięte',
    },
  },

  // Photos
  photos: {
    title: 'Zdjęcia',
    add: 'Dodaj zdjęcie',
    annotate: 'Dodaj adnotacje',
    analyze: 'Analizuj z AI',
    noPhotos: 'Brak zdjęć',
    caption: 'Podpis zdjęcia',
    aiAnalysisTitle: 'Opis zdjęcia — AI',
    aiAnalysisHint: 'AI opisuje tylko to, co widoczne. Zweryfikuj tekst przed zapisem.',
    aiAnalysisLoading: 'Analizuję zdjęcie…',
    aiReplace: 'Zastąp opis',
    aiAppend: 'Dopisz do opisu',
    aiCancel: 'Anuluj',
    aiError: 'Nie udało się przeanalizować zdjęcia',
    aiExistingHeader: 'Obecny opis',
    aiResultHeader: 'Propozycja AI (możesz edytować)',
  },

  // Floor Plans
  floorPlans: {
    title: 'Rzuty',
    add: 'Dodaj rzut',
    noPlans: 'Brak rzutów',
    label: 'Etykieta (np. Parter, Piętro 1)',
    addPin: 'Dodaj pinezkę',
    pinLabel: 'Numer usterki',
  },

  // Voice
  voice: {
    record: 'Nagraj notatkę',
    recording: 'Nagrywam...',
    processing: 'Przetwarzam...',
    rawTranscription: 'Surowy tekst',
    professionalText: 'Tekst profesjonalny (AI)',
    insertToDescription: 'Wstaw do opisu',
  },

  // Checklist
  checklist: {
    title: 'Checklista',
    progress: 'Postęp',
    elementState: 'Stan elementu',
    description: 'Opis stanu',
    notes: 'Uwagi',
    photos: 'Zdjęcia',
    status: {
      ok:        'OK',
      nok:       'NIE OK',
      nie_dotyczy: 'Nie dotyczy',
    },
    state: {
      dobry:       'Dobry / zadowalający',
      sredni:      'Średni / mało zadowalający',
      dostateczny: 'Dostateczny / niezadowalający',
      nie_dotyczy: 'Nie dotyczy',
    },
  },

  // Reports
  reports: {
    title: 'Raport',
    generate: 'Generuj raport',
    download: 'Pobierz PDF',
    send: 'Wyślij e-mailem',
    signInspector: 'Podpis inspektora',
    signClient: 'Podpis klienta/zarządcy',
    clear: 'Wyczyść',
    save: 'Zapisz podpis',
    selectType: 'Wybierz typ raportu',
    signatures: 'Podpisy',
    signBeforeReport: 'Zbierz podpisy przed wygenerowaniem raportu',
    generated: 'Raport wygenerowany',
    sending: 'Wysyłam...',
    sent: 'Raport wysłany',
  },

  // Clients
  clients: {
    title: 'Klienci',
    add: 'Dodaj klienta',
    noClients: 'Brak klientów',
    fullName: 'Imię i nazwisko / Firma',
    email: 'E-mail',
    phone: 'Telefon',
    address: 'Adres',
    inspections: 'Inspekcje klienta',
  },

  // Settings
  settings: {
    title: 'Ustawienia',
    profile: 'Profil',
    branding: 'Branding',
    companyName: 'Nazwa firmy',
    licenseNumber: 'Nr uprawnień budowlanych',
    poiibNumber: 'Nr członkowski POIIB',
    logo: 'Logo firmy',
    signature: 'Podpis cyfrowy',
    certificates: 'Certyfikaty/Uprawnienia',
    saved: 'Zapisano',
  },

  // Subscription
  subscription: {
    title: 'Subskrypcja',
    current: 'Aktualny plan',
    free: 'Darmowy',
    pro: 'PRO',
    company: 'Firma',
    upgrade: 'Ulepsz',
    manage: 'Zarządzaj',
    limitReached: 'Osiągnięto limit raportów',
    limitDesc: 'Ulepsz plan, aby generować więcej raportów',
  },

  // Common
  common: {
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usuń',
    edit: 'Edytuj',
    back: 'Wróć',
    next: 'Dalej',
    finish: 'Zakończ',
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    confirm: 'Potwierdź',
    search: 'Szukaj',
    filter: 'Filtruj',
    all: 'Wszystkie',
    yes: 'Tak',
    no: 'Nie',
    close: 'Zamknij',
    upload: 'Wgraj plik',
    optional: 'opcjonalne',
    required: 'wymagane',
    noData: 'Brak danych',
    createdAt: 'Utworzono',
    updatedAt: 'Zaktualizowano',
  },
} as const

export type TranslationKey = typeof pl
