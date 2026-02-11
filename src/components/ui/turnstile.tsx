import { useEffect, useRef, useCallback, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: TurnstileOptions
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId: string) => string | undefined
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'invisible'
  tabindex?: number
  action?: string
  cData?: string
  retry?: 'auto' | 'never'
  'retry-interval'?: number
  'refresh-expired'?: 'auto' | 'manual' | 'never'
  appearance?: 'always' | 'execute' | 'interaction-only'
}

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'invisible'
  className?: string
}

let scriptLoaded = false
let scriptLoading = false
const scriptLoadCallbacks: (() => void)[] = []

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded && window.turnstile) {
      resolve()
      return
    }

    if (scriptLoading) {
      scriptLoadCallbacks.push(resolve)
      return
    }

    scriptLoading = true

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    script.async = true
    script.defer = true

    window.onTurnstileLoad = () => {
      scriptLoaded = true
      scriptLoading = false
      resolve()
      scriptLoadCallbacks.forEach(cb => cb())
      scriptLoadCallbacks.length = 0
    }

    document.head.appendChild(script)
  })
}

export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  size = 'normal',
  className
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
        theme,
        size,
        retry: 'auto',
        'refresh-expired': 'auto'
      })
    } catch (err) {
      console.error('Turnstile render error:', err)
    }
  }, [siteKey, onVerify, onExpire, onError, theme, size])

  useEffect(() => {
    loadTurnstileScript().then(() => {
      setIsReady(true)
    })
  }, [])

  useEffect(() => {
    if (isReady) {
      renderWidget()
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Widget may already be removed
        }
        widgetIdRef.current = null
      }
    }
  }, [isReady, renderWidget])

  return (
    <div 
      ref={containerRef} 
      className={className}
      data-testid="turnstile-widget"
    />
  )
}

export function useTurnstileReset() {
  const reset = useCallback((widgetId: string | null) => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
    }
  }, [])

  return reset
}
