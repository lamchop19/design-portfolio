'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { showsBackdrop } from '@/lib/paths'
import { choiceLook, choiceMeta, DEFAULT_SCENE_ID } from '@/lib/scene-choice'

import './scene-backdrop.css'

/**
 * The painted scene behind the site, blurred and faint so the work stays in
 * front (Marc's "new layout"). The picture comes from CSS: data-scene on
 * <html> picks it (lib/scene-choice), so the server HTML is right from the
 * first frame. When the scene changes, the old picture stays on top and
 * dissolves through a dot screen, like the logo intro's ground. The
 * prototypes keep the grounds they were made on, apart from the guide lab.
 */
export function SceneBackdrop() {
  const shown = showsBackdrop(usePathname())
  const [leaving, setLeaving] = useState<{ id: string; key: number } | null>(null)

  useEffect(() => {
    if (!shown) return
    const html = document.documentElement
    const read = () => html.dataset.scene ?? DEFAULT_SCENE_ID
    let current = read()
    const observer = new MutationObserver(() => {
      const next = read()
      if (next === current) return
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setLeaving({ id: current, key: performance.now() })
      current = next
    })
    observer.observe(html, { attributes: true, attributeFilter: ['data-scene'] })
    return () => observer.disconnect()
  }, [shown])

  if (!shown) return null
  const old = leaving && choiceMeta(leaving.id)
  const look = old && choiceLook(old)

  return (
    <div className="bd" aria-hidden="true">
      <div className="bd-scene" />
      {leaving && look && (
        <div
          key={leaving.key}
          className="bd-scene bd-leaving"
          style={{ '--bd-src': `url("${look.src}")`, '--bd-pos': look.position } as React.CSSProperties}
          onAnimationEnd={() => setLeaving(null)}
        />
      )}
    </div>
  )
}
