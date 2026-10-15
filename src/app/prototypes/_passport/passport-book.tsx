'use client'

import { useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react'
import { ArrowUpRight, MoveUpRight } from 'lucide-react'

import { site } from '@/../content/site'
import { roles } from '../_flight/legs'

import styles from './passport.module.css'

/**
 * The booklet on its stage: a cover that swings open around the spine onto the
 * identity and journey spread. Open state belongs to the caller; `lightPass`
 * counts "catch the light" presses, and each new one runs a foil sweep.
 */
export function PassportBook({
  open,
  onOpen,
  lightPass,
  spreadId,
  label = 'MAL · Personal archive',
  className,
}: {
  open: boolean
  /** The closed cover was pressed. */
  onOpen: () => void
  lightPass: number
  spreadId: string
  label?: string
  className?: string
}) {
  const stage = useRef<HTMLDivElement>(null)
  const book = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
  }, [])

  function resetTilt() {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    const el = book.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
    el.style.setProperty('--light-x', '50%')
    el.style.setProperty('--light-y', '50%')
  }

  // Opening or closing starts from a level booklet.
  useLayoutEffect(resetTilt, [open])

  // Let the alternate foil position work even after pointer inspection.
  useLayoutEffect(() => {
    if (!lightPass) return
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    book.current?.style.removeProperty('--light-x')
    book.current?.style.removeProperty('--light-y')
  }, [lightPass])

  function inspect(event: PointerEvent<HTMLDivElement>) {
    if (!open || event.pointerType === 'touch' ||
      !window.matchMedia('(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)').matches) return
    const bounds = stage.current?.getBoundingClientRect()
    if (!bounds) return
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = book.current
      if (!el) return
      el.style.setProperty('--tilt-x', `${(0.5 - y) * 10}deg`)
      el.style.setProperty('--tilt-y', `${(x - 0.5) * 10}deg`)
      el.style.setProperty('--light-x', `${x * 100}%`)
      el.style.setProperty('--light-y', `${y * 100}%`)
      frame.current = null
    })
  }

  return (
    <div ref={stage} className={[styles.stage, className].filter(Boolean).join(' ')} data-open={open} onPointerMove={inspect} onPointerLeave={resetTilt} onPointerCancel={resetTilt}>
      <div className={styles.stageLabel} aria-hidden="true">{label}</div>
      <div ref={book} className={styles.book} data-open={open} data-light={lightPass % 2}>
        <Spread id={spreadId} open={open} />

        <button className={styles.cover} type="button" tabIndex={open ? -1 : 0} aria-hidden={open} aria-label="Open passport cover" aria-expanded={open} aria-controls={spreadId} onClick={onOpen}>
          <CoverFace />
        </button>
        {lightPass > 0 ? <span key={lightPass} className={styles.lightSweep} aria-hidden="true" /> : null}
      </div>
      <div className={styles.stageNumber} aria-hidden="true">{open ? '02 / Identity & impressions' : '01 / A first impression'}</div>
    </div>
  )
}

/** Both inside pages: identity on the left, the journey and its stamps on the right. */
function Spread({ id, open }: { id?: string; open: boolean }) {
  return (
    <div className={styles.spread} id={id} aria-hidden={!open} inert={!open}>
      <section className={`${styles.page} ${styles.identity}`} aria-label="Passport identity page">
        <SecurityPattern />
        <div className={styles.pageHeading}><span>Passport / Passeport</span><span>01</span></div>
        <div className={styles.identityTitle}><span>Creative<br />in transit.</span><Globe className={styles.pageGlobe} /></div>
        <div className={styles.identityGrid}>
          <div className={styles.portrait}>
            <svg className={styles.silhouette} viewBox="0 0 180 220" fill="none" aria-hidden="true">
              <path d="M0 166C32 156 148 156 180 166M0 179C32 169 148 169 180 179M0 192C32 182 148 182 180 192" stroke="currentColor" strokeWidth=".5" />
              <ellipse cx="90" cy="86" rx="33" ry="42" fill="currentColor" opacity=".2" />
              <path d="M23 220v-26c0-40 30-63 67-63s67 23 67 63v26" fill="currentColor" opacity=".2" />
              <path d="M18 30V18h12m120 0h12v12M18 190v12h12m120 0h12v-12" stroke="currentColor" opacity=".5" />
            </svg>
            <div className={styles.portraitFoil} aria-hidden="true" />
            <span className={styles.portraitCaption}>Portrait placeholder</span>
            <span className={styles.photoNumber} aria-hidden="true">MAL / 001</span>
          </div>
          <dl className={styles.details}>
            <div><dt>Surname</dt><dd>Lam</dd></div>
            <div><dt>Given names</dt><dd>Marc Andre</dd></div>
            <div><dt>Home base</dt><dd>New York City</dd></div>
            <div><dt>Preferred seat</dt><dd>Window, always</dd></div>
          </dl>
        </div>
        <dl className={styles.discipline}><div><dt>Field of practice</dt><dd>Brand · Social · Graphic design</dd></div></dl>
        <div className={styles.signatureRow}>
          <div><span className={styles.smallLabel}>Signature of holder</span><span className={styles.signature}>{site.name}</span></div>
          <div className={styles.seal} aria-hidden="true"><Globe /><span>MAL</span></div>
        </div>
        <div className={styles.machineCode} aria-hidden="true"><span>P&lt;MAL&lt;LAM&lt;&lt;MARC&lt;ANDRE&lt;&lt;&lt;&lt;&lt;&lt;</span><span>DESIGN&lt;&lt;COMMUNITY&lt;&lt;NYC&lt;&lt;&lt;&lt;&lt;&lt;</span></div>
      </section>

      <section className={`${styles.page} ${styles.story}`} aria-label="Biography and experience">
        <SecurityPattern />
        <div className={styles.pageHeading}><span>Notes from the journey</span><span>02</span></div>
        <h2>Hi, I’m Marc<span>.</span></h2>
        <p className={styles.bio}>{site.bio}</p>
        <div className={styles.journeyHeading}><span>A few stops along the way</span><ArrowUpRight size={14} /></div>
        <ul className={styles.stamps} aria-label="Experience">
          {roles.map((role, i) => (
            <li key={`${role.org}-${role.role}`} className={styles.stamp} data-stamp={i}>
              <span className={styles.stampOrg}>{role.org}</span>
              <strong>{role.stamp}</strong>
              <span className={styles.stampRole}>{role.role}</span>
              <span className={styles.stampDate}>{role.when}</span>
            </li>
          ))}
        </ul>
        <div className={styles.storyFooter}><span>Building brands &amp; communities</span><span>↗</span></div>
      </section>
    </div>
  )
}

/**
 * The booklet lying open and still, at its printed size (1000 × 640 with its edge), for a
 * caller to scale down: no stage, no cover, no tilt.
 */
export function PassportSpread({ className }: { className?: string }) {
  return (
    <div className={[styles.stillBook, className].filter(Boolean).join(' ')}>
      <div className={styles.book} data-open="true">
        <Spread open />
      </div>
    </div>
  )
}

/** What's printed on the cover: foil title, the MAL emblem and the holder's name. */
function CoverFace() {
  return (
    <>
      <span className={styles.coverFrame} aria-hidden="true" />
      <span className={styles.coverTop}>Independent designer<br />New York City</span>
      <span className={styles.coverTitle}>Passport</span>
      <span className={styles.coverSubtitle}>A world in progress</span>
      <span className={styles.emblem} aria-hidden="true"><Globe /><span className={styles.monogram}>MAL</span></span>
      <span className={styles.coverName}>{site.name}</span>
      <span className={styles.coverBottom}><span className={styles.chip} aria-hidden="true"><i /></span><span>Open to explore <MoveUpRight size={13} /></span></span>
    </>
  )
}

/**
 * The closed cover on its own, standing still at its printed size (500 × 560)
 * for a caller to scale down. Decorative: the caller supplies the control.
 */
export function PassportCover({ className }: { className?: string }) {
  return (
    <span className={[styles.loneCover, className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className={styles.cover}><CoverFace /></span>
    </span>
  )
}

function Globe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="45" />
      <ellipse cx="50" cy="50" rx="22" ry="45" />
      <ellipse cx="50" cy="50" rx="45" ry="19" />
      <path d="M5 50h90M50 5v90" />
    </svg>
  )
}

function SecurityPattern() {
  return <svg className={styles.securityPattern} viewBox="0 0 480 580" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <ellipse key={i} cx="240" cy="300" rx={110 + i * 5} ry={150 + i * 7} transform={`rotate(${i * 8} 240 300)`} />)}</svg>
}
