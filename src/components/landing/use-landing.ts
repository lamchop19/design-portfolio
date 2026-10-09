'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Which `[data-leg]` section of `root` the visitor is in: the last one whose
 * top has passed `line`, a fraction of the way down the viewport. Only a
 * change of leg re-renders.
 */
export function useActiveLeg(rootRef: React.RefObject<HTMLElement | null>, line = 0.5) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let tops: number[] = []
    let frame = 0

    const update = () => {
      frame = 0
      const mark = window.scrollY + window.innerHeight * line
      let leg = 0
      tops.forEach((top, i) => {
        if (top <= mark) leg = i
      })
      setActive(leg)
    }
    const measure = () => {
      tops = [...root.querySelectorAll<HTMLElement>('[data-leg]')].map(
        (section) => section.getBoundingClientRect().top + window.scrollY,
      )
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
  }, [rootRef, line])

  return active
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
