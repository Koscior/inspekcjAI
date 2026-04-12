import { Component, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  handleReload = () => {
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Coś poszło nie tak
          </h1>
          <p className="text-gray-600 mb-8">
            Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wrócić na stronę główną.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left text-xs text-red-800 overflow-auto max-h-40">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={this.handleRetry}>
              Spróbuj ponownie
            </Button>
            <Button onClick={this.handleReload} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Strona główna
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
