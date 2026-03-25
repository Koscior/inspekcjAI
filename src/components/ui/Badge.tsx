import { clsx } from 'clsx'

type Color = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple'
type Size  = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  color?: Color
  size?: Size
  dot?: boolean
  className?: string
}

const colors: Record<Color, string> = {
  gray:   'bg-gray-100 text-gray-700',
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
}

const dotColors: Record<Color, string> = {
  gray:   'bg-gray-400',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
}

export function Badge({ children, color = 'gray', size = 'sm', dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        colors[color],
        className,
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[color])} />}
      {children}
    </span>
  )
}

// ─── Severity Badge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: 'critical' | 'serious' | 'minor' }) {
  const map = {
    critical: { label: 'Krytyczna', color: 'red' as Color },
    serious:  { label: 'Poważna',   color: 'orange' as Color },
    minor:    { label: 'Drobna',    color: 'yellow' as Color },
  }
  const { label, color } = map[severity]
  return <Badge color={color} dot>{label}</Badge>
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    draft:       { label: 'Szkic',      color: 'gray' },
    in_progress: { label: 'W trakcie',  color: 'blue' },
    completed:   { label: 'Zakończona', color: 'green' },
    sent:        { label: 'Wysłana',    color: 'purple' },
    open:        { label: 'Otwarte',    color: 'red' },
    closed:      { label: 'Zamknięte',  color: 'green' },
  }
  const entry = map[status] ?? { label: status, color: 'gray' as Color }
  return <Badge color={entry.color} dot>{entry.label}</Badge>
}
