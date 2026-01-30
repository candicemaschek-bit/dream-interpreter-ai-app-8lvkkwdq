import { useEffect, useRef, useCallback } from 'react'

interface ScrollDetectionOptions {
  threshold?: number // How far into viewport before triggering (0-1, default 0.5)
  rootMargin?: string // Additional pixels to consider
}

/**
 * Hook to detect when a specific element enters the viewport during scroll
 * Calls callback only once when element first becomes visible
 */
export function useScrollDetection(
  callback: () => void,
  options: ScrollDetectionOptions = {}
) {
  const elementRef = useRef<HTMLDivElement>(null)
  const hasTriggeredRef = useRef(false)
  const { threshold = 0.5, rootMargin = '0px' } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Trigger callback only on first visible intersection
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true
            callback()
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [callback, threshold, rootMargin])

  return elementRef
}
