'use client'

import { useSyncExternalStore } from 'react'

import { THEME_STORAGE_KEY } from '@/lib/theme'

function getTheme(): 'light' | 'dark' {
  const saved = document.documentElement.dataset.theme
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
    if (event.newValue === 'light' || event.newValue === 'dark') {
      document.documentElement.dataset.theme = event.newValue
    } else {
      delete document.documentElement.dataset.theme
    }
    onChange()
  }

  systemTheme.addEventListener('change', onChange)
  window.addEventListener('theme-change', onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    systemTheme.removeEventListener('change', onChange)
    window.removeEventListener('theme-change', onChange)
    window.removeEventListener('storage', onStorage)
  }
}

function getServerTheme() {
  return null
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme)
  // Avoid exposing a non-working control before hydration or without JS.
  if (theme === null) return null

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  function toggleTheme() {
    document.documentElement.dataset.theme = nextTheme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // The choice still works for this visit when storage is blocked.
    }
    window.dispatchEvent(new Event('theme-change'))
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      className="absolute top-4 right-(--page-margin) z-20 flex min-h-11 items-center gap-2 rounded-full px-3 font-mono text-xs text-ink-muted transition-colors hover:bg-surface-raised hover:text-accent md:top-6"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {nextTheme === 'light' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        )}
      </svg>
      <span>{nextTheme === 'light' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
