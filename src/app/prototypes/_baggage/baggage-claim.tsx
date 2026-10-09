'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { SplitFlap } from '@/components/split-flap/split-flap'
import { asset } from '@/lib/paths'
import { flightCode, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { Segmented } from '../_flight/controls'
import { Backdrop, backdrops, type BackdropKind } from './backdrops'
import { BakedImg, baked } from './bake'
import { BagDocument, bagSize, type BagKind } from './bags'
import { LineDocument, lineSize, type LineKind } from './line-bags'
import { PixelDocument, pixelSize, type PixelKind } from './pixel-bags'

/**
 * Baggage claim: the footer as a carousel belt seen from above, running
 * sideways forever. One set of bags, SET_W wide (a whole number of slats, so
 * the wrap is invisible), is repeated along a track that a rAF loop slides.
 * Tagged bags are the case studies. Hovering slows the belt, scrolling the
 * page gives it a shove, swiping spins it, bags can be carried off anywhere,
 * and with reduced motion it only moves when pushed.
 */

type BeltStyle = 'riso' | 'pixel' | 'line'
type Direction = 'right' | 'left'
type TagMode = 'always' | 'hover'

const SET_W = 2048
const BELT_H = 232
/** Belt speed in px/s at the design height. */
const BASE = 70

type Placement<K extends string> = { kind: K; x: number; y: number; r?: number; project?: number }

const riso: Placement<BagKind>[] = [
  { kind: 'grid', x: 40, y: 36, r: -8, project: 0 },
  { kind: 'duffel', x: 230, y: 120, r: 12 },
  { kind: 'hatbox', x: 470, y: 20 },
  { kind: 'shell', x: 650, y: 70, r: -14, project: 1 },
  { kind: 'roll', x: 880, y: 30, r: 24 },
  { kind: 'dome', x: 1060, y: 100, r: -6 },
  { kind: 'trunk', x: 1270, y: 40, r: 8, project: 2 },
  { kind: 'backpack', x: 1520, y: 50, r: -18 },
  { kind: 'duffel', x: 1720, y: 20, r: -10, project: 3 },
]

// Pixel bags stay square to the grid and land on whole cells.
const pixel: Placement<PixelKind>[] = [
  { kind: 'suitcase', x: 48, y: 48, project: 0 },
  { kind: 'duffel', x: 256, y: 128 },
  { kind: 'hatbox', x: 512, y: 24 },
  { kind: 'trunk', x: 704, y: 96, project: 1 },
  { kind: 'crab', x: 936, y: 152 },
  { kind: 'backpack', x: 1096, y: 40 },
  { kind: 'duffel', x: 1296, y: 32, project: 2 },
  { kind: 'hatbox', x: 1560, y: 128 },
  { kind: 'trunk', x: 1744, y: 40, project: 3 },
]

const line: Placement<LineKind>[] = [
  { kind: 'suitcase', x: 40, y: 36, r: -8, project: 0 },
  { kind: 'duffel', x: 230, y: 120, r: 12 },
  { kind: 'hatbox', x: 470, y: 20 },
  { kind: 'shell', x: 650, y: 70, r: -14, project: 1 },
  { kind: 'backpack', x: 880, y: 40, r: 16 },
  { kind: 'dome', x: 1080, y: 100, r: -6 },
  { kind: 'suitcase', x: 1290, y: 30, r: 10, project: 2 },
  { kind: 'hatbox', x: 1500, y: 96 },
  { kind: 'duffel', x: 1700, y: 24, r: -10, project: 3 },
]

const TONES = ['blue', 'pink', 'green']

type Spot = { x: number; y: number }
type LooseSpot = Spot & { scale: number }
type BagSpec = Placement<string> & { art: React.ReactNode; size: [number, number] }

/** Every bag as its baked image; the line style carries a light and a dark bake and shows the one for the theme. */
function bagsFor(style: BeltStyle): BagSpec[] {
  if (style === 'riso') {
    return riso.map((p) => {
      const size = bagSize[p.kind]
      return { ...p, size, art: <BakedImg src={baked(`riso-${p.kind}`, () => <BagDocument kind={p.kind} />)} size={size} /> }
    })
  }
  if (style === 'pixel') {
    return pixel.map((p) => {
      const size = pixelSize(p.kind)
      return { ...p, size, art: <BakedImg src={baked(`pixel-${p.kind}`, () => <PixelDocument kind={p.kind} />)} size={size} /> }
    })
  }
  return line.map((p) => {
    const size = lineSize[p.kind]
    return {
      ...p,
      size,
      art: (
        <>
          <BakedImg src={baked(`line-light-${p.kind}`, () => <LineDocument kind={p.kind} theme="light" />)} size={size} className="bc-img-light" />
          <BakedImg src={baked(`line-dark-${p.kind}`, () => <LineDocument kind={p.kind} theme="dark" />)} size={size} className="bc-img-dark" />
        </>
      ),
    }
  })
}

/* -------------------------------------------------------------------------- */

/** What the belt exposes to pointer handlers: re-aim its speed, hold it, scrub it, and map screen points onto it. */
type BeltApi = {
  scale: () => number
  /** Ease the belt toward its current target speed (after hover, speed or direction change). */
  kick: () => void
  grab: () => void
  scrub: (dx: number) => void
  /** Let go; `velocity` is the swipe's speed in px/s, flung on then eased back. */
  release: (velocity: number) => void
  contains: (clientX: number, clientY: number) => boolean
  /** A screen point as a position within one set of bags. */
  toSet: (clientX: number, clientY: number) => Spot
}

/**
 * The belt runs as a Web Animation of the track's transform, so the
 * compositor moves it and the main thread does no work frame to frame. Speed
 * is the animation's playbackRate (1 = BASE px/s, negative runs it left); a
 * short rAF loop eases the rate only while it is changing — after a hover, a
 * swipe or a scroll — and then stops. A swipe pauses it and scrubs currentTime.
 */
function useBelt(
  bedRef: React.RefObject<HTMLDivElement | null>,
  trackRef: React.RefObject<HTMLDivElement | null>,
  speed: number,
  dir: Direction,
  onCopies: (copies: number) => void,
) {
  const hover = useRef(false)
  const opts = useRef({ speed, dir })
  const api = useRef<BeltApi | null>(null)

  useEffect(() => {
    opts.current = { speed, dir }
    api.current?.kick()
  }, [speed, dir])

  useEffect(() => {
    const bed = bedRef.current
    const track = trackRef.current
    if (!bed || !track) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    /** One set's crossing at rate 1, in ms. */
    const period = (SET_W / BASE) * 1000
    // Started far from zero so the belt can run backwards (and be scrubbed) for days without reaching the start.
    const origin = period * 100000
    let scale = 1
    let rate = 0
    let boost = 0
    let held = false
    let visible = false
    let raf = 0
    let last = 0
    let lastScroll = { y: window.scrollY, t: performance.now() }

    const keyframes = () => [
      { transform: `translate3d(${-SET_W * scale}px, 0, 0) scale(${scale})` },
      { transform: `translate3d(0, 0, 0) scale(${scale})` },
    ]
    const anim = track.animate(keyframes(), { duration: period, iterations: Infinity, easing: 'linear' })
    anim.currentTime = origin
    anim.playbackRate = 0
    const time = () => Number(anim.currentTime ?? origin)

    const target = () => {
      const sign = opts.current.dir === 'right' ? 1 : -1
      return sign * ((hover.current ? 0.15 : 1) * opts.current.speed + boost)
    }
    const step = (t: number) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0
      last = t
      boost *= Math.exp(-dt * 2.5)
      const goal = target()
      rate += (goal - rate) * (1 - Math.exp(-dt * 2))
      const settled = Math.abs(goal - rate) < 0.005 && boost < 0.005
      if (settled) rate = goal
      anim.playbackRate = rate
      raf = settled ? 0 : requestAnimationFrame(step)
    }
    const kick = () => {
      if (raf || held || reduce.matches || !visible) return
      last = 0
      raf = requestAnimationFrame(step)
    }
    const halt = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const running = () => {
      if (reduce.matches) {
        halt()
        rate = 0
        anim.playbackRate = 0
      } else if (visible && !held) {
        anim.play()
        kick()
      } else {
        halt()
        anim.pause()
      }
    }

    // Scrolling the page gives the belt a shove, in proportion to the scroll speed.
    const onScroll = () => {
      const now = performance.now()
      const v = Math.abs(window.scrollY - lastScroll.y) / Math.max(now - lastScroll.t, 1)
      lastScroll = { y: window.scrollY, t: now }
      boost = Math.max(boost, Math.min(v * 0.5 * (1000 / BASE), 20))
      kick()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    api.current = {
      scale: () => scale,
      kick,
      grab: () => {
        held = true
        halt()
        anim.pause()
      },
      scrub: (dx) => {
        anim.currentTime = time() + (dx / (SET_W * scale)) * period
      },
      release: (velocity) => {
        held = false
        rate = reduce.matches ? 0 : Math.max(-20, Math.min(20, velocity / (BASE * scale)))
        anim.playbackRate = rate
        running()
      },
      contains: (cx, cy) => {
        const r = bed.getBoundingClientRect()
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom
      },
      toSet: (cx, cy) => {
        const r = bed.getBoundingClientRect()
        const tx = -SET_W * scale * (1 - (time() % period) / period)
        return { x: ((((cx - r.left - tx) / scale) % SET_W) + SET_W) % SET_W, y: (cy - r.top) / scale }
      },
    }

    const resize = new ResizeObserver(() => {
      scale = bed.clientHeight / BELT_H
      ;(anim.effect as KeyframeEffect).setKeyframes(keyframes())
      // Enough sets that the belt is covered from any point in the loop.
      onCopies(Math.ceil(bed.clientWidth / (SET_W * scale)) + 1)
    })
    resize.observe(bed)
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      running()
    })
    seen.observe(bed)
    reduce.addEventListener('change', running)

    return () => {
      halt()
      anim.cancel()
      api.current = null
      window.removeEventListener('scroll', onScroll)
      resize.disconnect()
      seen.disconnect()
      reduce.removeEventListener('change', running)
    }
  }, [bedRef, trackRef, onCopies])

  return { hover, api }
}

/** Follows the pointer from a press until it lifts, after the first few pixels of travel. */
function follow(
  e: React.PointerEvent,
  { onStart, onMove, onEnd }: { onStart: () => void; onMove: (ev: PointerEvent) => void; onEnd: (ev: PointerEvent, moved: boolean) => void },
) {
  const start = { x: e.clientX, y: e.clientY }
  let moved = false
  const move = (ev: PointerEvent) => {
    if (!moved) {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return
      moved = true
      onStart()
    }
    onMove(ev)
  }
  const up = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
    onEnd(ev, moved)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}

/* -------------------------------------------------------------------------- */

/**
 * The belt and everything on it. Swipe the belt to spin it; pick a bag up to
 * carry it anywhere on the page. Put down on the belt it rides again; put down
 * anywhere else it stays where it was left (drawn in a layer over the page).
 * A press that doesn't travel is still a click, so tagged bags open their case study.
 */
export function BaggageBelt({
  items,
  style,
  speed = 1,
  dir = 'right',
  tags = 'always',
}: {
  items: WorkItem[]
  style: BeltStyle
  speed?: number
  dir?: Direction
  tags?: TagMode
}) {
  const bedRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const [copies, setCopies] = useState(2)
  const { hover, api } = useBelt(bedRef, trackRef, speed, dir, setCopies)
  const bags = bagsFor(style)

  const [onBelt, setOnBelt] = useState<Record<number, Spot>>({})
  const [loose, setLoose] = useState<Record<number, LooseSpot>>({})
  const [held, setHeld] = useState<(LooseSpot & { index: number }) | null>(null)

  const slow = (on: boolean) => () => {
    hover.current = on
    api.current?.kick()
  }

  /** Swipe: the belt follows the pointer, then flings on with whatever speed it was let go at. */
  const swipe = (e: React.PointerEvent) => {
    const belt = api.current
    if (e.button !== 0 || !belt) return
    let lastX = e.clientX
    let lastT = e.timeStamp
    let velocity = 0
    follow(e, {
      onStart: () => {
        belt.grab()
        document.documentElement.dataset.bcGrabbing = ''
      },
      onMove: (ev) => {
        const dx = ev.clientX - lastX
        const dt = (ev.timeStamp - lastT) / 1000
        belt.scrub(dx)
        if (dt > 0) velocity = velocity * 0.5 + (dx / dt) * 0.5
        lastX = ev.clientX
        lastT = ev.timeStamp
      },
      onEnd: (ev, moved) => {
        if (!moved) return
        // A pause before letting go means no fling.
        belt.release(ev.timeStamp - lastT < 80 ? velocity : 0)
        delete document.documentElement.dataset.bcGrabbing
      },
    })
  }

  /** Pick a bag up: it leaves the belt (or its spot on the page) and follows the pointer as a ghost. */
  const lift = (e: React.PointerEvent, index: number, scale: number) => {
    const belt = api.current
    if (e.button !== 0 || !belt) return
    e.stopPropagation()
    if (e.pointerType === 'mouse') e.preventDefault()
    const box = e.currentTarget.getBoundingClientRect()
    const off = { x: e.clientX - box.left, y: e.clientY - box.top }
    const h = bags[index].size[1]
    dragged.current = false
    follow(e, {
      onStart: () => {
        dragged.current = true
        document.documentElement.dataset.bcGrabbing = ''
        setHeld({ index, x: box.left, y: box.top, scale })
      },
      onMove: (ev) => {
        if (ghostRef.current) ghostRef.current.style.translate = `${ev.clientX - off.x}px ${ev.clientY - off.y}px`
      },
      onEnd: (ev, moved) => {
        if (!moved) return
        delete document.documentElement.dataset.bcGrabbing
        const x = ev.clientX - off.x
        const y = ev.clientY - off.y
        if (belt.contains(ev.clientX, ev.clientY)) {
          // Back on the belt, where it was dropped, kept within the rails.
          const at = belt.toSet(x, y)
          setOnBelt((spots) => ({ ...spots, [index]: { x: at.x, y: Math.min(Math.max(at.y, -h * 0.2), BELT_H - h * 0.8) } }))
          setLoose((spots) => {
            const rest = { ...spots }
            delete rest[index]
            return rest
          })
        } else {
          setLoose((spots) => ({ ...spots, [index]: { x: x + window.scrollX, y: y + window.scrollY, scale } }))
        }
        setHeld(null)
      },
    })
  }

  /** A drag that ends over a tagged bag's link must not also follow it. */
  const swallowDragClick = (e: React.MouseEvent) => {
    if (!dragged.current) return
    e.preventDefault()
    dragged.current = false
  }

  const contents = (bag: BagSpec, copy = 0) => {
    const item = bag.project !== undefined ? items[bag.project] : undefined
    const art = <span className="bc-bag-art">{bag.art}</span>
    return item ? (
      <Link href={`/work/${item.meta.slug}`} className="bc-bag-hit" draggable={false} tabIndex={copy ? -1 : undefined} onClick={swallowDragClick}>
        {art}
        <span className="bc-tag" data-tone={TONES[bag.project! % TONES.length]}>
          <b>{flightCode(item.meta)}</b> {item.meta.title}
        </span>
      </Link>
    ) : (
      <span className="bc-bag-hit">{art}</span>
    )
  }

  const layerAttrs = { 'data-style': style, 'data-tags': tags }
  const looseBags = Object.entries(loose).filter(([i]) => Number(i) !== held?.index)

  return (
    <div className={`bc-belt ${style === 'pixel' ? 'bc-pixel-cells' : ''}`} {...layerAttrs}>
      <div className={`bc-rail bc-rail-top ${style === 'pixel' ? 'pixel-row-0' : ''}`} aria-hidden="true" />
      <div
        ref={bedRef}
        className="bc-bed"
        onPointerEnter={slow(true)}
        onPointerLeave={slow(false)}
        onFocus={slow(true)}
        onBlur={slow(false)}
        onPointerDown={swipe}
      >
        <div ref={trackRef} className="bc-track" style={{ width: SET_W * copies, height: BELT_H }}>
          {Array.from({ length: copies }, (_, copy) => (
            <ul
              key={copy}
              className="bc-set"
              style={{ left: copy * SET_W }}
              aria-hidden={copy > 0 || undefined}
              aria-label={copy ? undefined : 'Baggage claim: case studies'}
            >
              {bags.map((bag, i) => {
                const spot = onBelt[i] ?? bag
                const gone = i in loose || held?.index === i
                return (
                  <li
                    key={i}
                    className="bc-bag"
                    data-gone={gone || undefined}
                    style={{ left: spot.x, top: spot.y, width: bag.size[0], height: bag.size[1], '--r': `${bag.r ?? 0}deg` } as React.CSSProperties}
                    onPointerDown={(e) => lift(e, i, api.current?.scale() ?? 1)}
                  >
                    {contents(bag, copy)}
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      </div>
      <div className={`bc-rail bc-rail-bottom ${style === 'pixel' ? 'pixel-row-1' : ''}`} aria-hidden="true" />

      {looseBags.length || held
        ? createPortal(
            <div className="bc-layer" {...layerAttrs}>
                      {looseBags.map(([i, spot]) => (
                <FreeBag key={i} bag={bags[Number(i)]} spot={spot} onLift={(e) => lift(e, Number(i), spot.scale)}>
                  {contents(bags[Number(i)])}
                </FreeBag>
              ))}
              {held ? (
                <FreeBag ref={ghostRef} bag={bags[held.index]} spot={held}>
                  {contents(bags[held.index])}
                </FreeBag>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** A bag off the belt, drawn at the size it was carried at: left on the page, or (with a ref) the one in hand. */
function FreeBag({
  bag,
  spot,
  onLift,
  ref,
  children,
}: {
  bag: BagSpec
  spot: LooseSpot
  onLift?: (e: React.PointerEvent<HTMLDivElement>) => void
  ref?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}) {
  const [w, h] = bag.size
  const ghost = !onLift
  return (
    <div
      ref={ref}
      className={ghost ? 'bc-ghost' : 'bc-bag bc-free'}
      style={{ ...(ghost ? { translate: `${spot.x}px ${spot.y}px` } : { left: spot.x, top: spot.y }), width: w * spot.scale, height: h * spot.scale }}
      onPointerDown={onLift}
    >
      <div className="bc-free-scale" style={{ width: w, height: h, scale: spot.scale, '--r': `${bag.r ?? 0}deg` } as React.CSSProperties}>
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const styles: Array<[BeltStyle, string]> = [
  ['riso', 'Riso'],
  ['pixel', 'Pixel'],
  ['line', 'Swiss line'],
]

const THANKS = 'Thanks for flying with me'
// On narrow screens the line stacks by phrase, one row of tiles each.
const THANKS_LINES = ['Thanks for', 'flying', 'with me']

type SignOffFont = 'helvetica' | 'sans' | 'mono'

const fonts: Array<[SignOffFont, string]> = [
  ['helvetica', 'Helvetica'],
  ['sans', 'Geist Sans'],
  ['mono', 'Geist Mono'],
]

/** Tracking for the proportional faces, in em, as the old sans headline had it. */
const TRACKING = -0.035

/**
 * The sign-off, set in split-flap tiles like the wordmark: one row, or stacked
 * by phrase on narrow screens. Unlike the wordmark's mono cells, each tile is
 * as wide as its letter's advance in the chosen face (kerning included), so a
 * proportional face sets like ordinary type. Every row is sized so the widest
 * one of its layout fills the width.
 */
function SignOff({ font, className }: { font: SignOffFont; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const root = ref.current!
    let live = true
    document.fonts.ready.then(() => {
      if (!live) return
      const ctx = document.createElement('canvas').getContext('2d')!
      // The rows, in order: the single line, then the stacked phrases.
      const rows = [...root.querySelectorAll<HTMLElement>('.flap-row')]
      const texts = [THANKS, ...THANKS_LINES].map((text) => text.toUpperCase())
      const tracking = font === 'mono' ? 0 : TRACKING
      const widths = rows.map((row, r) => {
        const css = getComputedStyle(row)
        ctx.font = `${css.fontWeight} 100px ${css.fontFamily}`
        const text = texts[r]
        const prefix = (n: number) => ctx.measureText(text.slice(0, n)).width / 100
        const advances = [...text].map((_, i) => prefix(i + 1) - prefix(i) + tracking)
        row.querySelectorAll<HTMLElement>('.flap').forEach((flap, i) => flap.style.setProperty('--w', String(advances[i])))
        return advances.reduce((sum, w) => sum + w, 0)
      })
      // The single row fills the width; the stacked rows share the size of the widest.
      const stackWidth = Math.max(...widths.slice(1))
      rows.forEach((row, i) => row.style.setProperty('--adv', String(i === 0 ? widths[0] : stackWidth)))
      root.dataset.measured = ''
    })
    return () => {
      live = false
    }
  }, [font])

  return (
    <h2
      ref={ref}
      className={['flap-wordmark bc-signoff', className].filter(Boolean).join(' ')}
      data-font={font}
      data-stack="narrow"
      // Mono cells until the rows are measured.
      style={{ '--stack-cols': Math.max(...THANKS_LINES.map((line) => line.length)) } as React.CSSProperties}
    >
      <span className="sr-only">{THANKS}</span>
      <SplitFlap text={THANKS} trigger="visible" ripple className="flap-wordmark-row" />
      {THANKS_LINES.map((line) => (
        <SplitFlap key={line} text={line} trigger="visible" ripple className="flap-wordmark-stack" />
      ))}
    </h2>
  )
}

/** The prototype page: a page end, the footer with the belt, and a panel of switches. */
export function BaggageClaimLab({ items }: { items: WorkItem[] }) {
  // ?style=pixel&backdrop=window opens straight onto a style and backdrop, for sharing and screenshots.
  const params = useSearchParams()
  const [style, setStyle] = useState<BeltStyle>(() => styles.find(([key]) => key === params.get('style'))?.[0] ?? 'riso')
  const [speed, setSpeed] = useState(1)
  const [dir, setDir] = useState<Direction>('right')
  const [tags, setTags] = useState<TagMode>('always')
  const [font, setFont] = useState<SignOffFont>('helvetica')
  const [backdrop, setBackdrop] = useState<BackdropKind>(() => backdrops.find(([key]) => key === params.get('backdrop'))?.[0] ?? 'none')
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)

  return (
    <>
      <section className="bc-hall swiss-grid min-h-[70svh] content-end pt-24 pb-20">
        <Backdrop kind={backdrop} items={items} />
        <SignOff font={font} className="col-span-full" />
      </section>

      <footer>
        <BaggageBelt key={`${style}-${round}`} items={items} style={style} speed={speed} dir={dir} tags={tags} />
        <nav className="flex flex-wrap items-baseline gap-x-8 gap-y-3 px-(--page-margin) py-8 font-mono text-xs tracking-wide uppercase">
          <Link href="/" className="text-ink transition-colors hover:text-accent">
            Index
          </Link>
          <Link href="/scraps" className="text-ink-muted transition-colors hover:text-accent">
            Scraps
          </Link>
          <span className="flex-1" />
          {site.links.map((link) => (
            <a
              key={link.label}
              href={link.kind === 'asset' ? asset(link.href) : link.href}
              target={link.kind === 'mail' ? undefined : '_blank'}
              rel="noreferrer"
              className="text-ink-muted transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </footer>

      <aside className="proto-controls leg-paper t-label" data-open={open || undefined}>
        <button type="button" className="proto-controls-tab" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Close ×' : 'Prototype'}
        </button>
        {open ? (
          <div className="proto-controls-panel">
            <Segmented label="Style" options={styles} value={style} onChange={setStyle} />
            <Segmented label="Sign-off face" options={fonts} value={font} onChange={setFont} />
            <Segmented label="Backdrop" options={backdrops} value={backdrop} onChange={setBackdrop} />
            <Segmented label="Speed" options={[[0.5, '0.5×'], [1, '1×'], [2, '2×']]} value={speed} onChange={setSpeed} />
            <Segmented label="Direction" options={[['right', 'Arriving →'], ['left', '← Departing']]} value={dir} onChange={setDir} />
            <Segmented label="Tags" options={[['always', 'Always'], ['hover', 'On hover']]} value={tags} onChange={setTags} />
            <div className="flex justify-between gap-4 border-t border-rule pt-3">
              <span className="text-ink-faint">Swipe the belt · drag a bag anywhere</span>
              <button type="button" className="transition-colors hover:text-accent" onClick={() => setRound(round + 1)}>
                Reset bags ↺
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  )
}
