export const APP_NAME = 'InspekcjAI'
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export const INSPECTION_TYPES = {
  roczny: 'Przegląd roczny',
  piecioletni: 'Przegląd pięcioletni',
  plac_zabaw: 'Inspekcja placu zabaw',
  odbior_mieszkania: 'Odbiór mieszkania/domu',
  ogolna: 'Inspekcja ogólna',
} as const

export const INSPECTION_TYPE_KEYS = Object.keys(INSPECTION_TYPES) as InspectionTypeKey[]
export type InspectionTypeKey = keyof typeof INSPECTION_TYPES

export const DEFECT_SEVERITY = {
  critical: { label: 'Krytyczna', color: 'red' },
  serious:  { label: 'Poważna',   color: 'orange' },
  minor:    { label: 'Drobna',    color: 'yellow' },
} as const

export const DEFECT_TYPES = {
  usterka: 'Usterka',
  uwaga:   'Uwaga',
  zalecenie: 'Zalecenie',
} as const

export const DEFECT_CATEGORIES = [
  'Prace wykończeniowe',
  'Konstrukcja',
  'Instalacje elektryczne',
  'Instalacje hydrauliczne',
  'Instalacja elektryczna/teletechniczna',
  'Tynki i malowanie',
  'Stolarka okienna',
  'Stolarka drzwiowa',
  'Podłogi',
  'Ściany',
  'Sufit',
  'Dach',
  'Elewacja',
  'Balkon/Taras',
  'Pozostałe prace',
  'Uwagi BHP',
] as const

export const DEFECT_STATUSES = {
  open:        'Nowy',
  in_progress: 'W trakcie',
  closed:      'Zakończone',
} as const

/** Inspection types that support checklist */
export const CHECKLIST_INSPECTION_TYPES = ['roczny', 'piecioletni', 'plac_zabaw'] as const

/** Inspection types that support building documentation section */
export const BUILDING_DOCS_INSPECTION_TYPES = ['roczny', 'piecioletni'] as const

export const BUILDING_CONSTRUCTION_TYPES = [
  'żelbetowa',
  'murowana',
  'drewniana',
  'stalowa',
  'inna',
] as const

export const ELEMENT_STATE = {
  dobry:      'Dobry / zadowalający',
  sredni:     'Średni / mało zadowalający',
  dostateczny:'Dostateczny / niezadowalający',
  nie_dotyczy:'Nie dotyczy',
} as const

export const FREE_PLAN_REPORT_LIMIT = 3

export const REPORT_TYPES = {
  techniczny: 'Raport Techniczny',
  zadania:    'Raport Zadań',
  protokol:   'Protokół Przeglądu',
} as const

export const STORAGE_BUCKETS = {
  photos:     'photos',
  floorPlans: 'floor-plans',
  voiceNotes: 'voice-notes',
  reportPdfs: 'report-pdfs',
  branding:   'branding',
} as const
