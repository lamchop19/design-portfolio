'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { scrollToY } from '@/components/layout/smooth-scroll'

import type { Chapter } from './chapters'

/*
 * Where the reader is on the disc. Chapters start at their title cards
 * (`data-chapter`) and run to the next one; a chapter is "playing" once the
 * reading line, a little under the middle of the screen, has crossed its
 * card. How far through each chapter the line is goes onto the disc as --f0,
 * --f1… (0 to 1), so every scrubber, rail and title-card bar fills from the
 * same numbers without re-rendering; React only hears the chapter and the
 * whole seconds read, which change far less often.
 */

/** The reading line, as a share of the screen's height from the top. */
const LINE = 0.45
/** Room left above a chapter's title card when jumping to it: the frame's pills and the rail strip. */
const CLEARANCE = 132

export type Reading = {
  /** The chapter under the reading line. */
  current: number
  /** Seconds read so far, over all chapters. */
  elapsed: number
  /** Scrolls to chapter `i`, `at` of the way through it; 0 lands on its title card. */
  seek: (i: number, at?: number) => void
}

export function useReading(
  rootRef: React.RefObject<HTMLElement | null>,
  readingRef: React.RefObject<HTMLElement | null>,
  chapters: Chapter[],
  enabled: boolean,
): Reading {
  const [current, setCurrent] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const bounds = useRef<{ starts: number[]; end: number; marks: HTMLElement[] }>({ starts: [], end: 0, marks: [] })

  useEffect(() => {
    const root = rootRef.current
    const reading = readingRef.current
    if (!enabled || !root || !reading) return
    let frame = 0

    const update = () => {
      frame = 0
      const { starts, end } = bounds.current
      if (!starts.length) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      // At the very bottom of the page the last chapter counts as read, however short the screen.
      const line = window.scrollY >= max - 2 ? Infinity : window.scrollY + window.innerHeight * LINE
      let now = 0
      let read = 0
      starts.forEach((start, i) => {
        const stop = starts[i + 1] ?? end
        const f = Math.min(1, Math.max(0, (line - start) / Math.max(1, stop - start)))
        root.style.setProperty(`--f${i}`, f.toFixed(4))
        if (line >= start) now = i
        read += f * (chapters[i]?.seconds ?? 0)
      })
      setCurrent(now)
      setElapsed(Math.floor(read))
    }

    const measure = () => {
      const marks = [...reading.querySelectorAll<HTMLElement>('[data-chapter]')]
      const top = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY
      bounds.current = { starts: marks.map(top), end: top(reading) + reading.offsetHeight, marks }
      update()
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // Fonts landing and images loading both move the chapters.
    const observer = new ResizeObserver(measure)
    observer.observe(reading)
    observer.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.fonts?.ready.then(measure)
    measure()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      chapters.forEach((_, i) => root.style.removeProperty(`--f${i}`))
    }
  }, [rootRef, readingRef, chapters, enabled])

  const seek = useCallback((i: number, at = 0) => {
    const { starts, end, marks } = bounds.current
    if (starts[i] === undefined) return
    const share = Math.min(1, Math.max(0, at))
    const stop = starts[i + 1] ?? end
    const y = share === 0 ? starts[i] - CLEARANCE : starts[i] + share * (stop - starts[i]) - window.innerHeight * LINE
    scrollToY(Math.max(0, y))
    // Keyboard and screen-reader users land on the chapter too.
    marks[i]?.focus({ preventScroll: true })
  }, [])

  return { current, elapsed, seek }
}
