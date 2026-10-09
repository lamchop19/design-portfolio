'use client'

import { useEffect, useRef, useState } from 'react'

import { carryOn } from './legs'
import { useMediaQuery } from './use-flight'

/**
 * The overhead bins along the top of the cruise leg. One holds the carry-on:
 * open it and the skills tumble out, pile up along the bottom of the leg, and
 * can be grabbed and thrown around; stow them and they fly back up.
 *
 * The physics is matter-js, loaded only when the bin first opens. Our own rAF
 * loop steps it and writes each chip's translate/rotate, and stops as soon as
 * every chip has come to rest. With reduced motion the chips are simply laid
 * out along the floor.
 */

const BINS = ['13 A–C', '14 A–C', 'Carry-on', '16 A–C']
const CARRY = 2
const TONES = ['blue', 'pink', 'green', 'paper', 'ink']
/** Fixed physics step, ms. */
const STEP = 1000 / 60

export function OverheadBin({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const layerRef = useRef<HTMLDivElement>(null)
  const doorRef = useRef<HTMLButtonElement>(null)
  const chipRefs = useRef<Array<HTMLLIElement | null>>([])
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)')
  // The chips appear as soon as the bin opens, and stay through the flight home after it closes.
  const [shown, setShown] = useState(false)
  if (open && !shown) setShown(true)
  const stowing = shown && !open

  useEffect(() => {
    const layer = layerRef.current
    const door = doorRef.current
    if (!open || calm || !layer || !door) return
    let cancelled = false
    let teardown = () => {}

    import('matter-js').then((M) => {
      if (cancelled) return
      const chips = chipRefs.current.filter((el): el is HTMLLIElement => el !== null)
      const engine = M.Engine.create({ enableSleeping: true })
      const world = engine.world

      // The room: floor, sides clear of the page margin and rail, and a ceiling.
      const walls: Matter.Body[] = []
      const build = () => {
        M.Composite.remove(world, walls)
        walls.length = 0
        const { width: w, height: h } = layer.getBoundingClientRect()
        const margin = cssPx(layer, '--page-margin') || 24
        const rail = cssPx(layer, '--rail-space')
        const t = 400
        const floor = h - 20
        walls.push(
          M.Bodies.rectangle(w / 2, floor + t / 2, w * 3, t, { isStatic: true }),
          M.Bodies.rectangle(w / 2, -t / 2, w * 3, t, { isStatic: true }),
          M.Bodies.rectangle(margin - t / 2, h / 2, t, h * 3, { isStatic: true }),
          M.Bodies.rectangle(w - margin - rail + t / 2, h / 2, t, h * 3, { isStatic: true }),
        )
        M.Composite.add(world, walls)
      }
      build()

      // Each chip leaves the bin a beat after the last, with a toss and a spin.
      const box = layer.getBoundingClientRect()
      const mouth = door.getBoundingClientRect()
      const from = { x: mouth.left - box.left + mouth.width / 2, y: mouth.bottom - box.top + 10 }
      const bodies = new Map<HTMLLIElement, Matter.Body>()
      const timers = chips.map((el, i) =>
        window.setTimeout(() => {
          const body = M.Bodies.rectangle(from.x + (Math.random() - 0.5) * mouth.width * 0.5, from.y, el.offsetWidth, el.offsetHeight, {
            chamfer: { radius: 8 },
            restitution: 0.35,
            friction: 0.4,
            frictionAir: 0.012,
          })
          M.Body.setVelocity(body, { x: (Math.random() - 0.5) * 9, y: 2 + Math.random() * 3 })
          M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08)
          M.Composite.add(world, body)
          bodies.set(el, body)
          el.dataset.live = ''
          wake()
        }, i * 90),
      )

      const sync = () => {
        for (const [el, body] of bodies) {
          el.style.translate = `${body.position.x - el.offsetWidth / 2}px ${body.position.y - el.offsetHeight / 2}px`
          el.style.rotate = `${body.angle}rad`
        }
      }

      let raf = 0
      let last = 0
      let spare = 0
      let held: Matter.Constraint | null = null
      const tick = (t: number) => {
        spare += last ? Math.min(t - last, 100) : STEP
        last = t
        while (spare >= STEP) {
          M.Engine.update(engine, STEP)
          spare -= STEP
        }
        sync()
        const resting = bodies.size === chips.length && [...bodies.values()].every((b) => b.isSleeping)
        raf = resting && !held ? 0 : requestAnimationFrame(tick)
      }
      function wake() {
        if (raf) return
        last = 0
        raf = requestAnimationFrame(tick)
      }

      // Grab a chip by the point under the pointer; it swings from there and keeps its throw when let go.
      const point = (e: PointerEvent) => {
        const r = layer.getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top }
      }
      const onDown = (e: PointerEvent) => {
        const el = (e.target as Element).closest<HTMLLIElement>('.bin-chip')
        const body = el && bodies.get(el)
        if (!body || e.button !== 0) return
        e.preventDefault()
        const at = point(e)
        M.Sleeping.set(body, false)
        held = M.Constraint.create({
          pointA: at,
          bodyB: body,
          pointB: { x: at.x - body.position.x, y: at.y - body.position.y },
          stiffness: 0.25,
          damping: 0.05,
          length: 0,
        })
        // Let the grab point turn with the chip, as matter's own mouse constraint does.
        ;(held as Matter.Constraint & { angleB: number }).angleB = body.angle
        M.Composite.add(world, held)
        document.documentElement.dataset.binGrab = ''
        wake()
        const move = (ev: PointerEvent) => {
          if (held) held.pointA = point(ev)
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          if (held) M.Composite.remove(world, held)
          held = null
          delete document.documentElement.dataset.binGrab
          wake()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
      }
      layer.addEventListener('pointerdown', onDown)

      const resize = new ResizeObserver(() => {
        build()
        for (const body of bodies.values()) M.Sleeping.set(body, false)
        wake()
      })
      resize.observe(layer)

      teardown = () => {
        timers.forEach(clearTimeout)
        cancelAnimationFrame(raf)
        resize.disconnect()
        layer.removeEventListener('pointerdown', onDown)
        delete document.documentElement.dataset.binGrab
        M.Engine.clear(engine)
      }
    })

    return () => {
      cancelled = true
      teardown()
    }
  }, [open, calm])

  // Stowing: every chip flies back up into the bin's mouth and shrinks away, then the door shuts.
  useEffect(() => {
    const layer = layerRef.current
    const door = doorRef.current
    if (!stowing || !layer || !door) return
    const box = layer.getBoundingClientRect()
    const mouth = door.getBoundingClientRect()
    chipRefs.current.forEach((el, i) => {
      if (!el) return
      el.style.transition = `translate 520ms var(--ease-in-out) ${i * 40}ms, rotate 520ms ${i * 40}ms, scale 520ms ${i * 40}ms, opacity 300ms ${i * 40 + 260}ms`
      el.style.translate = `${mouth.left - box.left + mouth.width / 2 - el.offsetWidth / 2}px ${mouth.bottom - box.top - el.offsetHeight}px`
      el.style.rotate = '0rad'
      el.style.scale = '0.4'
      el.style.opacity = '0'
    })
    const done = window.setTimeout(() => setShown(false), 520 + chipRefs.current.length * 40 + 120)
    return () => clearTimeout(done)
  }, [stowing])

  return (
    <div ref={layerRef} className="bin-layer">
      <div className="bin-row">
        {BINS.map((label, i) =>
          i === CARRY ? (
            <div key={label} className="bin" data-carry="" data-open={open || undefined}>
              <button
                ref={doorRef}
                type="button"
                className="bin-door"
                aria-expanded={open}
                aria-label={open ? 'Close the overhead bin' : 'Open the overhead bin: carry-on'}
                onClick={onToggle}
              >
                <span className="bin-placard t-label">{label}</span>
                <span className="bin-latch" />
              </button>
            </div>
          ) : (
            <div key={label} className="bin" aria-hidden="true">
              <span className="bin-door">
                <span className="bin-placard t-label">{label}</span>
                <span className="bin-latch" />
              </span>
            </div>
          ),
        )}
      </div>

      {shown ? (
        <ul className="bin-chips" aria-label="Carry-on" data-still={calm || undefined}>
          {carryOn.map((skill, i) => (
            <li
              key={skill}
              ref={(el) => {
                chipRefs.current[i] = el
              }}
              className="bin-chip"
              data-tone={TONES[i % TONES.length]}
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** A length custom property (px or rem) in pixels. */
function cssPx(el: Element, name: string) {
  const value = getComputedStyle(el).getPropertyValue(name).trim()
  const n = parseFloat(value) || 0
  return value.endsWith('rem') ? n * parseFloat(getComputedStyle(document.documentElement).fontSize) : n
}
