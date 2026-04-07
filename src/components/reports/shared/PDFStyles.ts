import { StyleSheet } from '@react-pdf/renderer'

// ─── Color palette ───────────────────────────────────────────────────────────

export const COLORS = {
  primary: '#2563EB',      // blue-600
  primaryDark: '#1D4ED8',  // blue-700
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  white: '#FFFFFF',
  accent: '#DAA520',       // gold for defect accent bars
  accentLight: '#FFF8E1',  // light gold tint
  red500: '#EF4444',
  red100: '#FEE2E2',
  orange500: '#F97316',
  orange100: '#FFEDD5',
  yellow500: '#EAB308',
  yellow100: '#FEF9C3',
  green500: '#22C55E',
  green100: '#DCFCE7',
} as const

// ─── Severity colors ─────────────────────────────────────────────────────────

export const SEVERITY_COLORS = {
  critical: { bg: COLORS.red500, text: COLORS.white, light: COLORS.red100 },
  serious: { bg: COLORS.orange500, text: COLORS.white, light: COLORS.orange100 },
  minor: { bg: COLORS.yellow500, text: COLORS.gray900, light: COLORS.yellow100 },
} as const

export const STATUS_COLORS = {
  open: { bg: COLORS.red100, text: COLORS.red500 },
  in_progress: { bg: COLORS.orange100, text: COLORS.orange500 },
  closed: { bg: COLORS.green100, text: COLORS.green500 },
} as const

// ─── Common styles ───────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  // Page
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: COLORS.gray700,
    lineHeight: 1.4,
  },

  // Typography
  h1: { fontSize: 22, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 6 },
  h2: { fontSize: 14, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 4 },
  h3: { fontSize: 11, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 3 },
  label: { fontSize: 9, fontWeight: 'bold', color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { fontSize: 10, color: COLORS.gray700 },
  small: { fontSize: 8, color: COLORS.gray500 },

  // Section header (gray bar)
  sectionHeader: {
    backgroundColor: COLORS.gray600,
    color: COLORS.white,
    padding: 8,
    paddingHorizontal: 12,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 2,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 2,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    minHeight: 24,
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: COLORS.gray100,
    fontWeight: 'bold',
    fontSize: 7,
    color: COLORS.gray600,
    textTransform: 'uppercase',
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    justifyContent: 'center',
  },
  tableCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 8,
    justifyContent: 'center',
  },

  // Cards
  card: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },

  // Grid (2-col photos)
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  photoCol: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    objectFit: 'contain',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  photoCaption: {
    fontSize: 7,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: 2,
  },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    marginVertical: 8,
  },

  // Flex helpers
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
  flex1: { flex: 1 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
})
