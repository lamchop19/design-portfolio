'use client'

import { useEffect } from 'react'

/**
 * On touch screens nothing is pointed at, so the prints crossing the middle of
 * the screen develop instead: `onChange` gets the indexes of the elements
 * matching `selector` that are in the middle band (a whole row of a grid at
 * once). Change `key` when the elements are replaced.
 */
export function useCentred(selector: string, onChange: (indexes: number[]) => void, key?: unknown) {
  useEffect(() => {
    if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) return
    const elements = [...document.querySelectorAll<HTMLElement>(selector)]
    const inBand = new Set<number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = elements.indexOf(entry.target as HTMLElement)
          if (entry.isIntersecting) inBand.add(i)
          else inBand.delete(i)
        }
        onChange([...inBand])
      },
      // A band a tenth of the screen tall, across its middle.
      { rootMargin: '-45% 0px -45% 0px' },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
    // `key` is the caller's word that the elements changed; onChange is a state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, key])
}
