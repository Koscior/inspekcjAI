import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  hover?: boolean
}

const paddings = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
}

export function Card({ children, className, padding = 'md', onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        paddings[padding],
        hover && 'cursor-pointer hover:border-primary-300 hover:shadow-md transition-all',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── Card Header ──────────────────────────────────────────────────────────────
interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
