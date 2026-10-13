'use client'

import { useEffect, useRef, useState } from 'react'

import { LiveClock } from '@/components/brand/live-clock'
import { WindowShade } from '@/components/layout/window-shade'

import { ELSEWHERE, type Elsewhere } from './elsewhere'
import { BANDS, COLORS, MARKS, type Bands, type Mark } from './marks'
import { SLABS } from './slab'
import { TrackMark } from './track'
import './logo.css'

/** Sets the page's favicon to an SVG for as long as `svg` is set, then puts the original back. */
function useFaviconPreview(svg: string | null) {
  useEffect(() => {
    if (!svg) return
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')]
    const before = links.map((link) => link.href)
    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    links.forEach((link) => (link.href = href))
    return () => links.forEach((link, i) => (link.href = before[i]))
  }, [svg])
}

function MarkCard({
  mark,
  bands,
  color,
  previewing,
  onPreview,
}: {
  mark: Mark
  bands: Bands
  color: string
  previewing: boolean
  onPreview: (svg: string | null) => void
}) {
  const favicon = useRef<HTMLDivElement>(null)
  // Favicons sit on a tile so they hold up on light and dark browser chrome.
  const faviconColor = color === 'currentColor' ? '#0a0f1f' : color

  return (
    <article className="lg-card" aria-labelledby={`lg-${mark.id}`}>
      <div className="lg-hero">
        <TrackMark mark={mark} bands={bands} color={color} className="lg-hero-mark" title={`${mark.label} logo`} />
      </div>

      <div className="lg-meta">
        <h2 id={`lg-${mark.id}`} className="t-label">
          {mark.label}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">{mark.note}</p>
      </div>

      <div className="lg-strip" aria-label="In the site header">
        <TrackMark mark={mark} bands={bands} color={color} className="lg-strip-mark" />
        <LiveClock />
      </div>

      <div className="lg-favicons">
        <div ref={favicon} className="lg-fav-sizes">
          {[16, 32, 64].map((size) => (
            <span key={size} className="lg-fav" style={{ width: size, height: size }}>
              <TrackMark mark={mark} bands={size < 32 ? 'solid' : bands} color="#ffffff" tile={faviconColor} />
            </span>
          ))}
        </div>
        <button
          type="button"
          className="lg-btn t-label"
          aria-pressed={previewing}
          onClick={() => onPreview(previewing ? null : (favicon.current?.querySelector('.lg-fav:nth-child(3) svg')?.outerHTML ?? null))}
        >
          {previewing ? 'Previewing in tab' : 'Preview as favicon'}
        </button>
      </div>
    </article>
  )
}

function ElsewhereCard({
  item,
  previewing,
  onPreview,
}: {
  item: Elsewhere
  previewing: boolean
  onPreview: (svg: string | null) => void
}) {
  const favicon = useRef<HTMLDivElement>(null)
  const { Mark } = item

  return (
    <article className="lg-card" aria-labelledby={`lg-${item.id}`}>
      <div className="lg-hero">
        <Mark className="lg-hero-mark" />
      </div>

      <div className="lg-meta">
        <h3 id={`lg-${item.id}`} className="t-label">
          {item.label}
        </h3>
        <p className="t-label text-ink-faint">From: {item.source}</p>
        <p className="text-sm leading-relaxed text-ink-muted">{item.note}</p>
      </div>

      <div className="lg-strip" aria-label="In the site header">
        <Mark className="lg-strip-mark" />
        <LiveClock />
      </div>

      <div className="lg-favicons">
        <div ref={favicon} className="lg-fav-sizes">
          {[16, 32, 64].map((size) => (
            <span key={size} className="lg-fav" style={{ width: size, height: size }}>
              <Mark compact />
            </span>
          ))}
        </div>
        <button
          type="button"
          className="lg-btn t-label"
          aria-pressed={previewing}
          onClick={() => onPreview(previewing ? null : (favicon.current?.querySelector('.lg-fav:nth-child(3) svg')?.outerHTML ?? null))}
        >
          {previewing ? 'Previewing in tab' : 'Preview as favicon'}
        </button>
      </div>
    </article>
  )
}

/**
 * Logo candidates in the manner of the 1974 Greater Manchester Transport M,
 * each shown large, at header size beside the clock, and as a favicon at
 * 16, 32 and 64 px. A favicon can be tried in the real browser tab.
 */
export function LogoLab() {
  const [bands, setBands] = useState<Bands>('double')
  const [colorId, setColorId] = useState('blue')
  const [preview, setPreview] = useState<{ id: string; svg: string } | null>(null)
  const color = COLORS.find((c) => c.id === colorId)!.value
  useFaviconPreview(preview?.svg ?? null)

  return (
    <div className="lg-page">
      <header className="swiss-grid items-end gap-y-5 pt-6 pb-8">
        <div className="col-span-full grid gap-3 md:col-span-7">
          <p className="t-label text-ink-faint">Logo · after Kenneth Hollick, Greater Manchester Transport, 1974</p>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4.75rem)] leading-[0.92] tracking-[-0.04em]">
            One line, three letters
          </h1>
          <p className="max-w-[62ch] text-ink-muted">
            Hollick drew an M as a single route with parallel lanes. These marks use the same method on MAL: rounded
            turns, lanes that never break, and feet that run out along the baseline.
          </p>
        </div>
        <div className="col-span-full grid gap-3 md:col-span-5 md:justify-items-end">
          <div className="lg-controls" role="group" aria-label="Lanes">
            {BANDS.map((b) => (
              <button key={b.id} type="button" className="lg-seg t-label" aria-pressed={bands === b.id} onClick={() => setBands(b.id)}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="lg-controls" role="group" aria-label="Colour">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className="lg-seg t-label"
                aria-pressed={colorId === c.id}
                onClick={() => setColorId(c.id)}
              >
                <span className="lg-swatch" style={{ background: c.value === 'currentColor' ? 'var(--ink)' : c.value }} />
                {c.label}
              </button>
            ))}
          </div>
          <WindowShade inline />
        </div>
      </header>

      <h2 className="lg-section t-label">After Hollick · colour and lanes apply here</h2>
      <div className="lg-grid">
        {MARKS.map((mark) => (
          <MarkCard
            key={mark.id}
            mark={mark}
            bands={bands}
            color={color}
            previewing={preview?.id === mark.id}
            onPreview={(svg) => setPreview(svg ? { id: mark.id, svg } : null)}
          />
        ))}
      </div>

      <h2 className="lg-section t-label">Slab · after the College Misericordia CM</h2>
      <div className="lg-grid">
        {SLABS.map((item) => (
          <ElsewhereCard
            key={item.id}
            item={item}
            previewing={preview?.id === item.id}
            onPreview={(svg) => setPreview(svg ? { id: item.id, svg } : null)}
          />
        ))}
      </div>

      <h2 className="lg-section t-label">Elsewhere · marks from other sources</h2>
      <div className="lg-grid">
        {ELSEWHERE.map((item) => (
          <ElsewhereCard
            key={item.id}
            item={item}
            previewing={preview?.id === item.id}
            onPreview={(svg) => setPreview(svg ? { id: item.id, svg } : null)}
          />
        ))}
      </div>
    </div>
  )
}
