import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean | null>(null)

  // Initialize theme on mount
  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme-mode')
    if (saved === 'dark' || saved === 'light') {
      const isDarkMode = saved === 'dark'
      setIsDark(isDarkMode)
      applyTheme(isDarkMode)
      return
    }

    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(prefersDark)
    applyTheme(prefersDark)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply if user hasn't explicitly set a preference
      const saved = localStorage.getItem('theme-mode')
      if (!saved) {
        setIsDark(e.matches)
        applyTheme(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const applyTheme = (isDarkMode: boolean) => {
    const html = document.documentElement
    if (isDarkMode) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev
      // Update DOM
      applyTheme(newValue)
      // Persist choice
      localStorage.setItem('theme-mode', newValue ? 'dark' : 'light')
      return newValue
    })
  }

  return { isDark, toggleTheme }
}
