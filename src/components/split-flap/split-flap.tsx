'use client'

import { useEffect, useRef, useState } from 'react'

import { FLAP_DRUM } from '@/lib/flap'
import { FLAP_LAND_MS, FLAP_STEP_MS, fallKeyframes, type FlapMotion } from '@/lib/flap-motion'

type SplitFlapProps = {
  text: string
  /** Tile count. Shorter text is padded with blank tiles, longer text is cut. */
  length?: number
  /** When the opening cascade plays. `none` shows the text as rendered. */
  trigger?: 'load' | 'visible' | 'none'
  /**
   * Milliseconds before the cascade starts. Give `first`/`repeat` to wait
   * longer on the session's first visit, when the wordmark plays in full.
   */
  delay?: number | { first: number; repeat: number }
  /**
   * Text the board shows first, on the session's first visit only: the tiles
   * cascade to it, hold, then turn over to `text`. Screen readers and the
   * server-rendered markup only ever carry `text`.
   */
  preroll?: string
  /** Tiles flick over as the pointer passes across them. */
  ripple?: boolean
  /** The characters each tile carries, in flip order. */
  drum?: string
  /**
   * `bare` flips the glyphs alone and sits on the page like ordinary text;
   * `tile` draws the physical board, card and shading included.
   */
  variant?: 'bare' | 'tile'
  /**
   * `auto` plays the full cascade once per session; `quick` always lands in a
   * few flips; `full` always plays it (and the preroll), for comparing timings.
   */
  intro?: 'auto' | 'quick' | 'full'
  /** How a change of `text` travels: forward along the drum, or straight there. */
  swap?: 'drum' | 'quick'
  /** Flip duration and fall curve. Omit for the stock timing. */
  motion?: FlapMotion
  className?: string
}

const STEP_MS = FLAP_STEP_MS
const LAND_MS = FLAP_LAND_MS
const STAGGER_MS = 35
const SEEN_KEY = 'flap-seen'
const PREROLL_HOLD_MS = 700

type Cell = {
  el: HTMLElement
  halves: HTMLElement[]
  ch: string
  goal: string
  queue: string[]
  running: boolean
}

/**
 * A row of split-flap tiles. The server renders the finished text, so the tiles
 * are complete without JS; on the client each tile is driven imperatively
 * (textContent plus the Web Animations API), never through React state, so a
 * flip costs no re-render.
 *
 * Changing `text` flips each tile forward through the drum to its new character.
 * The row is decorative: callers provide the accessible text alongside it.
 */
export function SplitFlap({
  text,
  length,
  trigger = 'load',
  delay = 0,
  preroll,
  ripple = false,
  drum = FLAP_DRUM,
  variant = 'bare',
  intro = 'auto',
  swap = 'drum',
  motion,
  className,
}: SplitFlapProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const boardRef = useRef<ReturnType<typeof createBoard> | null>(null)
  const target = pad(text, length)
  // The markup keeps its first characters for good; later text arrives through
  // the board so React never overwrites a tile mid-flip.
  const [initial] = useState(target)

  useEffect(() => {
    const board = createBoard(rootRef.current!, target, drum, {
      trigger,
      delay,
      preroll: preroll === undefined ? undefined : pad(preroll, target.length),
      ripple,
      intro,
      swap,
      motion,
      shade: variant === 'tile',
    })
    boardRef.current = board
    return () => {
      board.destroy()
      boardRef.current = null
    }
    // The opening cascade belongs to the mount; later changes are text only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    boardRef.current?.show(target)
  }, [target])

  return (
    <span
      ref={rootRef}
      aria-hidden="true"
      className={['flap-row', className].filter(Boolean).join(' ')}
      data-variant={variant}
      style={{ '--n': initial.length } as React.CSSProperties}
    >
      {[...initial].map((ch, i) => (
        <span key={i} className="flap">
          <span className="flap-half flap-top">{ch}</span>
          <span className="flap-half flap-bottom">{ch}</span>
          <span className="flap-half flap-leaf flap-leaf-top">{ch}</span>
          <span className="flap-half flap-leaf flap-leaf-bottom">{ch}</span>
        </span>
      ))}
    </span>
  )
}

/**
 * Split-flap text with its own accessible copy: screen readers get `text` as
 * written, and the tiles beside it stay decorative.
 */
export function FlapText({ className, ...props }: SplitFlapProps) {
  return (
    <span className={className}>
      <span className="sr-only">{props.text}</span>
      <SplitFlap {...props} />
    </span>
  )
}

function pad(text: string, length?: number) {
  const upper = text.toUpperCase()
  return length === undefined ? upper : upper.padEnd(length).slice(0, length)
}

function nextOnDrum(drum: string, ch: string) {
  const i = drum.indexOf(ch)
  return i === -1 ? drum[0] : drum[(i + 1) % drum.length]
}

function stepToward(drum: string, ch: string, goal: string) {
  if (!drum.includes(ch) || !drum.includes(goal)) return goal
  return nextOnDrum(drum, ch)
}

/**
 * A few characters back along the drum: 2–4 for the short replay on repeat
 * visits, or further for a longer run that still skips most of the drum.
 */
function nearlyAt(drum: string, goal: string, least = 2, spread = 3) {
  const i = drum.indexOf(goal)
  if (i <= 0) return goal
  const back = least + Math.floor(Math.random() * spread)
  return drum[(i - back + drum.length) % drum.length]
}

// Instances mounted in the same commit share one decision, so the wordmark and
// the board both play the full cascade on the first visit of a session, and the
// short one after that — including after client-side navigation back.
let introPlayed = false

function isFirstVisit() {
  let seen = introPlayed
  try {
    seen ||= sessionStorage.getItem(SEEN_KEY) !== null
  } catch {}
  return !seen
}

function takeIntroMode(): 'full' | 'quick' {
  const first = isFirstVisit()
  setTimeout(() => {
    introPlayed = true
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
  })
  return first ? 'full' : 'quick'
}

function createBoard(
  root: HTMLElement,
  text: string,
  drum: string,
  {
    trigger,
    delay,
    preroll,
    ripple,
    intro: introSetting,
    swap,
    motion,
    shade,
  }: {
    trigger: SplitFlapProps['trigger']
    delay: NonNullable<SplitFlapProps['delay']>
    preroll: string | undefined
    ripple: boolean
    intro: NonNullable<SplitFlapProps['intro']>
    swap: NonNullable<SplitFlapProps['swap']>
    motion: FlapMotion | undefined
    /** Darken the leaves as they turn. Only a tile has a face to darken. */
    shade: boolean
  },
) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Read before any intro in this commit marks the session as seen.
  const wait = typeof delay === 'number' ? delay : isFirstVisit() ? delay.first : delay.repeat
  const timers = new Set<number>()
  let alive = true

  // Goals come from the text, not the DOM: a remount (React's dev double-mount,
  // or a fast navigation) can find the tiles mid-cascade.
  const cells: Cell[] = [...root.querySelectorAll<HTMLElement>('.flap')].map((el, i) => {
    const ch = el.firstElementChild!.textContent ?? ' '
    return { el, halves: [...el.children] as HTMLElement[], ch, goal: text[i] ?? ' ', queue: [], running: false }
  })

  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }

  function paint(cell: Cell, ch: string) {
    for (const half of cell.halves) half.textContent = ch
    cell.ch = ch
  }

  async function flip(cell: Cell, next: string, ms: number, land: boolean) {
    const [top, bottom, leafTop, leafBottom] = cell.halves
    top.textContent = next
    bottom.textContent = cell.ch
    leafTop.textContent = cell.ch
    leafBottom.textContent = next

    // The upper leaf falls away and darkens as it turns from the light; the
    // lower leaf swings down to meet the stop, and on landing bounces off it.
    if (motion?.ease) {
      const frames = fallKeyframes(motion.ease, land, shade)
      leafTop.animate(frames.top, ms)
      const fall = leafBottom.animate(frames.bottom, ms)
      await fall.finished
      bottom.textContent = next
      leafTop.textContent = next
      cell.ch = next
      return
    }

    const lit = (b: number) => (shade ? { filter: `brightness(${b})` } : {})
    leafTop.animate(
      [
        { transform: 'rotateX(0deg)', ...lit(1), easing: 'cubic-bezier(.55,0,1,.45)' },
        { transform: 'rotateX(-90deg)', ...lit(0.5), offset: 0.5 },
        { transform: 'rotateX(-90deg)', ...lit(0.5) },
      ],
      ms,
    )
    const settle = leafBottom.animate(
      land
        ? [
            { transform: 'rotateX(90deg)', ...lit(0.55) },
            { transform: 'rotateX(90deg)', ...lit(0.55), offset: 0.45, easing: 'cubic-bezier(.3,0,.8,.6)' },
            { transform: 'rotateX(0deg)', ...lit(1), offset: 0.78, easing: 'ease-out' },
            { transform: 'rotateX(14deg)', ...lit(0.9), offset: 0.88, easing: 'ease-in' },
            { transform: 'rotateX(0deg)', ...lit(1) },
          ]
        : [
            { transform: 'rotateX(90deg)', ...lit(0.55) },
            { transform: 'rotateX(90deg)', ...lit(0.55), offset: 0.5, easing: 'cubic-bezier(0,.55,.45,1)' },
            { transform: 'rotateX(0deg)', ...lit(1) },
          ],
      ms,
    )
    await settle.finished
    bottom.textContent = next
    leafTop.textContent = next
    cell.ch = next
  }

  async function run(cell: Cell) {
    if (cell.running) return
    cell.running = true
    // Bare tiles show their leaves only while they turn.
    cell.el.dataset.moving = ''
    try {
      while (alive && (cell.queue.length || cell.ch !== cell.goal)) {
        const next = cell.queue.shift() ?? stepToward(drum, cell.ch, cell.goal)
        const land = next === cell.goal && !cell.queue.length
        // Each flip runs a little fast or slow so the board never ticks in sync.
        const ms = land ? (motion?.land ?? LAND_MS) : (motion?.step ?? STEP_MS) * (0.88 + Math.random() * 0.24)
        await flip(cell, next, ms, land)
      }
    } catch {
      // Animations are cancelled on unmount; nothing to recover.
    } finally {
      cell.running = false
      delete cell.el.dataset.moving
    }
  }

  // The text last asked for. The mount-time call repeats the opening text,
  // which must not undo a preroll's goals.
  let shown = text

  function show(next: string) {
    if (next === shown) return
    shown = next
    cells.forEach((cell, i) => {
      const goal = next[i] ?? ' '
      if (goal === cell.goal) return
      cell.goal = goal
      if (reduced) return paint(cell, goal)
      // A quick swap flicks through one stray character and lands, however far
      // apart the two are on the drum.
      if (swap === 'quick') cell.queue = [stray(), goal]
      void run(cell)
    })
  }

  /** Any character but the blank, for flicks that pass through on the way. */
  function stray() {
    return drum[1 + Math.floor(Math.random() * (drum.length - 1))]
  }

  /** After a preroll: the whole row turns over, left to right, in a few flicks each. */
  function turnOver() {
    cells.forEach((cell, i) =>
      later(() => {
        cell.goal = shown[i] ?? ' '
        if (cell.ch === cell.goal) return
        cell.queue = [stray(), stray(), cell.goal]
        void run(cell)
      }, i * STAGGER_MS),
    )
  }

  function intro() {
    const mode = introSetting === 'auto' ? takeIntroMode() : introSetting
    const greet = mode === 'full' && preroll !== undefined
    if (greet) cells.forEach((cell, i) => (cell.goal = preroll[i] ?? ' '))
    // A greeting starts part-way along the drum, so the name isn't kept waiting.
    for (const cell of cells)
      paint(cell, greet ? nearlyAt(drum, cell.goal, 6, 6) : mode === 'full' ? drum[0] : nearlyAt(drum, cell.goal))
    root.dataset.flapReady = ''
    const begin = () => {
      const landed = cells.map(
        (cell, i) =>
          new Promise<void>((resolve) =>
            later(() => void run(cell).then(resolve), wait + i * STAGGER_MS * (mode === 'full' ? 1 : 0.4)),
          ),
      )
      if (greet) void Promise.all(landed).then(() => later(turnOver, PREROLL_HOLD_MS))
    }
    if (trigger === 'load') return begin()
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        begin()
      },
      { threshold: 0.5 },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }

  const stopIntro = !reduced && trigger !== 'none' ? intro() : undefined
  if (reduced || trigger === 'none') root.dataset.flapReady = ''

  // Ripple: a tile the pointer crosses flicks over twice and lands back on its
  // letter. Sweeping across the row sends a run of clacks along it.
  let lastHovered: HTMLElement | null = null
  function onOver(event: PointerEvent) {
    if (event.pointerType === 'touch') return
    const el = (event.target as Element).closest<HTMLElement>('.flap')
    if (!el || el === lastHovered) return
    lastHovered = el
    const cell = cells.find((c) => c.el === el)
    if (!cell || cell.running || cell.goal.trim() === '') return
    const first = nextOnDrum(drum, cell.ch)
    cell.queue.push(first, nextOnDrum(drum, first), cell.goal)
    void run(cell)
  }
  function onLeave() {
    lastHovered = null
  }
  if (ripple && !reduced) {
    root.addEventListener('pointerover', onOver)
    root.addEventListener('pointerleave', onLeave)
  }

  return {
    show,
    destroy() {
      alive = false
      stopIntro?.()
      for (const id of timers) clearTimeout(id)
      for (const cell of cells) for (const half of cell.halves) for (const a of half.getAnimations()) a.cancel()
      root.removeEventListener('pointerover', onOver)
      root.removeEventListener('pointerleave', onLeave)
    },
  }
}
