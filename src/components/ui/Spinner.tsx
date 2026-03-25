import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizes = { sm: 16, md: 24, lg: 40 }

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={clsx('flex items-center justify-center gap-2', className)}>
      <Loader2 size={sizes[size]} className="animate-spin text-primary-600" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  )
}

export function PageSpinner({ label = 'Ładowanie...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  )
}
