'use client'

import { useEffect } from 'react'

/**
 * Draws the page's columns and baseline over everything, toggled with the G
 * key. A layout tool: it has no visible control.
 */
export function GridOverlay() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'g' || event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.target as HTMLElement).closest('input, textarea, [contenteditable]')) return
      const root = document.documentElement
      if ('grid' in root.dataset) delete root.dataset.grid
      else root.dataset.grid = ''
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="grid-overlay swiss-grid" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  )
}
