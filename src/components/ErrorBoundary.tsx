import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              An error occurred while rendering the application.
            </p>
            
            {this.state.error && (
              <div className="bg-muted p-4 rounded text-left overflow-auto max-h-48 mb-6 text-xs font-mono">
                <p className="font-bold text-red-500">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="default">
                Refresh Page
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
