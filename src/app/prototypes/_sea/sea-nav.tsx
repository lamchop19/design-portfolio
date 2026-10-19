'use client'

import { useEffect, useState } from 'react'

import { site } from '@/../content/site'

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const

/**
 * The sticky name pill. Over the sky it is just the name; once the page
 * leaves the surface (or the pill is pointed at or focused) it opens to the
 * sections, the one in view marked. Plain #anchors, so it works without JS;
 * with it, Lenis scrolls there smoothly.
 */
export function SeaNav() {
  const [first, ...rest] = site.name.split(' ')
  const [below, setBelow] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)

  useEffect(() => {
    const top = document.getElementById('top')
    const sections = ['work', 'about'].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (!top) return

    const leaving = new IntersectionObserver(([entry]) => setBelow(entry.intersectionRatio < 0.55), { threshold: [0, 0.55, 1] })
    leaving.observe(top)

    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    sections.forEach((section) => spy.observe(section))
    const onTop = new IntersectionObserver(([entry]) => entry.isIntersecting && setCurrent(null), { rootMargin: '-45% 0px -45% 0px' })
    onTop.observe(top)

    return () => {
      leaving.disconnect()
      spy.disconnect()
      onTop.disconnect()
    }
  }, [])

  return (
    <nav className="sea-nav" aria-label="Sections" data-open={below || undefined}>
      <a href="#top" className="sea-nav-name" aria-label={site.name}>
        {first}
        <span className="sea-nav-rest">&nbsp;{rest.join(' ')}</span>
      </a>
      <span className="sea-nav-reveal">
        <span className="sea-nav-links">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} aria-current={current === section.id ? 'true' : undefined}>
              {section.label}
            </a>
          ))}
        </span>
      </span>
    </nav>
  )
}
