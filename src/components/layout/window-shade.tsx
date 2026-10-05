'use client'

import { usePathname } from 'next/navigation'
import { useRef, useState, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

import { FlapText } from '@/components/split-flap/split-flap'
import { placesOwnShade } from '@/lib/paths'
import { THEME_STORAGE_KEY } from '@/lib/theme'

type Theme = 'light' | 'dark'

function getTheme(): Theme {
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

function writeTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The choice still works for this visit when storage is blocked.
  }
  window.dispatchEvent(new Event('theme-change'))
}

/**
 * Switches theme with the page itself acting as the shade: closing sweeps the
 * dark theme down over the page from the top, opening lifts it off from the
 * bottom. See the `data-shade` rules in globals.css.
 */
function setTheme(theme: Theme) {
  const root = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || !document.startViewTransition) return writeTheme(theme)

  root.dataset.shade = theme === 'dark' ? 'closing' : 'opening'
  // flushSync so the new snapshot already shows the shade in its new place.
  const transition = document.startViewTransition(() => flushSync(() => writeTheme(theme)))
  void transition.finished.finally(() => delete root.dataset.shade)
}

/** Pointer travel, in px, that pulls the shade all the way. */
const DRAG_RANGE = 48

/**
 * The theme control: a plane window. Closing the shade is dark mode, opening
 * it is light. Click or press to toggle; the shade can also be dragged, and
 * letting go past halfway commits.
 *
 * By default it floats in the top-right corner. `inline` sets it in the flow
 * for layouts that give it a place on their grid; the floating one stands
 * aside on the homepage, which does.
 */
export function WindowShade({ inline = false }: { inline?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme)
  const pathname = usePathname()
  // While dragging, how far down the shade is pulled, 0 (open) to 1 (closed).
  const [pull, setPull] = useState<number | null>(null)
  const drag = useRef<{ y: number; from: number; moved: boolean } | null>(null)
  const dragged = useRef(false)

  // Avoid exposing a non-working control before hydration or without JS.
  if (theme === null) return null
  if (!inline && placesOwnShade(pathname)) return null

  const closed = theme === 'dark'
  const next: Theme = closed ? 'light' : 'dark'

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    drag.current = { y: event.clientY, from: closed ? 1 : 0, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current
    if (!d) return
    const dy = event.clientY - d.y
    if (!d.moved && Math.abs(dy) < 4) return
    d.moved = true
    setPull(Math.min(1, Math.max(0, d.from + dy / DRAG_RANGE)))
  }

  function onPointerUp() {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    // A drag ends in its own decision; swallow the click that follows it.
    dragged.current = true
    const shut = (pull ?? d.from) > 0.5
    setPull(null)
    if (shut !== closed) setTheme(shut ? 'dark' : 'light')
  }

  function onClick() {
    if (dragged.current) {
      dragged.current = false
      return
    }
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null
        setPull(null)
      }}
      aria-pressed={closed}
      aria-label={`Window shade (${closed ? 'closed, dark mode' : 'open, light mode'})`}
      className={
        inline
          ? 'window-shade t-label inline-flex items-center gap-2.5 text-ink-muted transition-colors hover:text-accent'
          : 'window-shade t-label absolute top-4 right-(--page-margin) z-20 flex min-h-11 items-center gap-2.5 px-3 text-ink-muted transition-colors hover:text-accent md:top-6'
      }
    >
      <span
        className="window"
        data-dragging={pull !== null || undefined}
        style={{ '--pull': pull ?? (closed ? 1 : 0) } as React.CSSProperties}
        aria-hidden="true"
      >
        <span className="window-sky">
          <span className="window-cloud" />
        </span>
        <span className="window-blind" />
      </span>
      <FlapText text={closed ? 'Shade down' : 'Window open'} length={11} trigger="none" swap="quick" />
    </button>
  )
}
