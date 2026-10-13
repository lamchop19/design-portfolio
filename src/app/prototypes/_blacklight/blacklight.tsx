'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

import { WindowShade } from '@/components/layout/window-shade'
import { BoardingPass } from '@/components/work/boarding-pass'
import { flightCode, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { marks, MRZ } from './marks'
import './blacklight.css'

type Mode = 'off' | 'torch' | 'full'
const MODES: Array<[Mode, string]> = [
  ['off', 'Lights on'],
  ['torch', 'UV torch'],
  ['full', 'Full UV'],
]

// The chosen mode, kept per visitor. Storage can be missing or blocked, so
// every read and write falls back to the lights-on page.
const KEY = 'uv-mode'
const listeners = new Set<() => void>()
function readMode(): Mode {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'torch' || value === 'full' ? value : 'off'
  } catch {
    return 'off'
  }
}
function writeMode(mode: Mode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {}
  listeners.forEach((fn) => fn())
}
function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * The homepage's passes with a hidden layer. Under UV each pass shows what
 * normally stays off the page: a margin note, the process sketch, the
 * direction that was dropped. The torch lights only what's in its beam.
 */
export function Blacklight({ items }: { items: WorkItem[] }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => 'off' as Mode)
  const page = useRef<HTMLDivElement>(null)

  // The beam is a mask on each mark, so every mark needs the pointer in its
  // own coordinates. Measured once a frame, only while the torch is on.
  useEffect(() => {
    const root = page.current
    if (!root || mode !== 'torch') return
    let frame = 0
    let x = -999
    let y = -999
    const paint = () => {
      frame = 0
      root.style.setProperty('--beam-x', `${x}px`)
      root.style.setProperty('--beam-y', `${y}px`)
      root.querySelectorAll<HTMLElement>('.uv-mark').forEach((el) => {
        const box = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${x - box.left}px`)
        el.style.setProperty('--my', `${y - box.top}px`)
      })
    }
    const move = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerdown', move)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', move)
      window.removeEventListener('scroll', scroll)
    }
  }, [mode])

  const lit = mode !== 'off'

  return (
    <div ref={page} className="uv-page" data-uv={mode}>
      <div className="uv-beam" aria-hidden="true" />

      <header className="swiss-grid gap-y-6 pt-5 pb-16 md:pb-24">
        <div className="t-label col-span-full flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <span className="uv-faint">Marc Andre Lam · Portfolio</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div role="radiogroup" aria-label="Blacklight" className="uv-switch">
              {MODES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => writeMode(value)}
                  className="uv-switch-option"
                >
                  {label}
                </button>
              ))}
            </div>
            <WindowShade inline />
          </div>
        </div>

        <h1 className="col-span-full mt-[10vh] font-display text-[clamp(3rem,10vw,9rem)] leading-[0.88] tracking-[-0.04em] md:col-span-10">
          {site.name}
        </h1>
        <p className="uv-muted col-span-full max-w-[52ch] text-lg md:col-span-6">{site.bio}</p>
        <p className="t-label uv-hint col-span-full md:col-span-6 md:col-start-7 md:self-end md:text-right">
          {mode === 'off' ? 'Switch on the UV lamp to see what’s under the passes' : mode === 'torch' ? 'Move the torch over the passes' : 'Everything under the passes, lit'}
        </p>
      </header>

      <ol className="grid gap-y-16 md:gap-y-20">
        {items.map((item, i) => {
          const m = marks[item.meta.slug]
          return (
            <li key={item.meta.slug} className="swiss-grid gap-y-4">
              <div className="col-span-full md:col-span-7">
                <BoardingPass item={item} index={i} variant="card" morph={false} />
                <p className="t-label uv-mark uv-micro mt-2" aria-hidden={!lit}>
                  {m?.stamp} · {flightCode(item.meta)} · Void if photocopied
                </p>
              </div>
              {m ? (
                <div className="col-span-full grid content-start gap-4 md:col-span-5" aria-hidden={!lit}>
                  <p className="uv-mark uv-note">{m.note}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="uv-mark uv-slot">
                      <span className="t-label">Process sketch</span>
                      <span className="uv-path">→ {m.sketch}</span>
                    </div>
                    <div className="uv-mark uv-slot uv-slot-rejected">
                      <span className="t-label">Rejected direction</span>
                      <span>{m.rejected}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      <footer className="swiss-grid mt-24 gap-y-6 border-t border-rule pt-8 pb-12">
        <p className="t-label col-span-full flex flex-wrap gap-x-6 gap-y-2 md:col-span-6">
          {site.links.map((link) => (
            <a key={link.label} href={link.href} className="underline underline-offset-4 hover:text-accent">
              {link.label}
            </a>
          ))}
        </p>
        <p className="t-label uv-faint col-span-full md:col-span-6 md:text-right">{site.email}</p>
        <div className="uv-mark uv-mrz col-span-full" aria-hidden={!lit}>
          {MRZ.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
