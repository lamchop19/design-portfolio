'use client'

import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

import { placesOwnThemeToggle } from '@/lib/paths'
import { THEME_STORAGE_KEY } from '@/lib/theme'

type Theme = 'light' | 'dark'

/** Dark is the default; light only once it has been chosen. */
function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
    if (event.newValue === 'light' || event.newValue === 'dark') {
      document.documentElement.dataset.theme = event.newValue
    } else {
      delete document.documentElement.dataset.theme
    }
    onChange()
  }

  window.addEventListener('theme-change', onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('theme-change', onChange)
    window.removeEventListener('storage', onStorage)
  }
}

function getServerTheme() {
  return null
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The choice still works for this visit when storage is blocked.
  }
  window.dispatchEvent(new Event('theme-change'))
}

/**
 * The theme control: a text button that names the theme it switches to.
 *
 * By default it floats in the top-right corner. `inline` sets it in the flow
 * for layouts that give it a place on their grid; the floating one stands
 * aside on pages that do.
 */
export function ThemeToggle({ inline = false }: { inline?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme)
  const pathname = usePathname()

  // Avoid exposing a non-working control before hydration or without JS.
  if (theme === null) return null
  if (!inline && placesOwnThemeToggle(pathname)) return null

  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      className={
        inline
          ? 't-label inline-flex min-h-11 items-center text-ink-muted transition-colors hover:text-accent'
          : 't-label absolute top-4 right-(--page-margin) z-20 flex min-h-11 items-center px-3 text-ink-muted transition-colors hover:text-accent md:top-6'
      }
    >
      {next === 'light' ? 'Light' : 'Dark'}
    </button>
  )
}
