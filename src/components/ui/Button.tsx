import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
type Size    = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border border-transparent',
  secondary: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 border border-gray-300',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400 border border-transparent',
  link:      'bg-transparent text-primary-600 hover:underline focus:ring-primary-500 border border-transparent p-0',
}

const sizes: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          variant !== 'link' && sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
