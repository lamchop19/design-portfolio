'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { altitude, legs } from './legs'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Where the visitor is on the route. `report` is called every scroll frame:
 * the progress goes straight to a CSS variable and the altitude readout (no
 * re-render); only a change of leg re-renders the strip and rail.
 */
export function useFlightState() {
  const [active, setActive] = useState(0)
  const [stops, setStops] = useState<number[]>(() => legs.map((_, i) => i / (legs.length - 1)))
  const readoutRef = useRef<HTMLSpanElement>(null)
  const stopsRef = useRef(stops)

  useEffect(() => {
    stopsRef.current = stops
  }, [stops])

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('--flight-p')
    },
    [],
  )

  const report = useCallback((progress: number, leg: number) => {
    document.documentElement.style.setProperty('--flight-p', progress.toFixed(4))
    setActive(leg)
    const feet = Math.round(altitude(progress, stopsRef.current) / 100) * 100
    const [alt, flown] = readoutRef.current?.children ?? []
    if (alt) alt.textContent = `Alt ${feet.toLocaleString('en-US')} ft`
    if (flown) flown.textContent = `${Math.round(progress * 100)}% flown`
  }, [])

  return { active, stops, setStops, report, readoutRef }
}

/**
 * Pins `outer`'s sticky child for a stretch of scrolling and turns that
 * scrolling into sideways travel of `track`: the page grows by exactly the
 * track's overflow, so one pixel down moves the track one pixel left.
 * `track`'s parent is the window it is seen through.
 */
export function usePinnedTrack(
  outerRef: React.RefObject<HTMLElement | null>,
  trackRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  handlers: { onMeasure?: (max: number) => void; onMove?: (progress: number, x: number) => void } = {},
) {
  const metrics = useRef({ max: 0, width: 0 })
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const outer = outerRef.current
    const track = trackRef.current
    if (!outer || !track) return
    if (!enabled) {
      outer.style.height = ''
      track.style.transform = ''
      track.style.removeProperty('--pane-w')
      return
    }
    const view = track.parentElement!
    let frame = 0

    const update = () => {
      frame = 0
      const { max } = metrics.current
      const x = Math.min(max, Math.max(0, -outer.getBoundingClientRect().top))
      track.style.transform = `translate3d(${-x}px, 0, 0)`
      handlersRef.current.onMove?.(max ? x / max : 0, x)
    }
    const measure = () => {
      track.style.setProperty('--pane-w', `${view.clientWidth}px`)
      const max = Math.max(0, track.scrollWidth - view.clientWidth)
      metrics.current = { max, width: view.clientWidth }
      outer.style.height = `${max + window.innerHeight}px`
      handlersRef.current.onMeasure?.(max)
      update()
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }

    const resize = new ResizeObserver(measure)
    resize.observe(track)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', onScroll, { passive: true })
    measure()
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
      outer.style.height = ''
      track.style.transform = ''
    }
  }, [outerRef, trackRef, enabled])

  return metrics
}

/** Progress through a page of stacked `[data-leg]` sections, read from the window's scroll. */
export function useDocumentTracker(
  rootRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  report: (progress: number, leg: number) => void,
  setStops: (stops: number[]) => void,
) {
  useEffect(() => {
    const root = rootRef.current
    if (!enabled || !root) return
    let tops: number[] = []
    let max = 1
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      let leg = 0
      tops.forEach((top, i) => {
        if (top <= y + window.innerHeight / 2) leg = i
      })
      report(clamp01(y / max), leg)
    }
    const measure = () => {
      const sections = [...root.querySelectorAll<HTMLElement>('[data-leg]')]
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      tops = sections.map((section) => section.getBoundingClientRect().top + window.scrollY)
      setStops(tops.map((top) => clamp01(top / max)))
      update()
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }

    const resize = new ResizeObserver(measure)
    resize.observe(root)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', onScroll, { passive: true })
    measure()
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
    }
  }, [rootRef, enabled, report, setStops])
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** True once the element has been mostly on screen. */
export function useSeen<T extends Element>(threshold = 0.4) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setSeen(true)
        observer.disconnect()
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, seen] as const
}
