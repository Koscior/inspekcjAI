import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useUiStore, type Toast as ToastType } from '@/store/uiStore'

const icons = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error:   <XCircle    size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-yellow-500" />,
  info:    <Info       size={18} className="text-blue-500" />,
}

const colors = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200   bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  info:    'border-blue-200  bg-blue-50',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUiStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md text-sm',
        'animate-in slide-in-from-right-5 duration-300',
        colors[toast.type],
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-gray-800">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-600 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
