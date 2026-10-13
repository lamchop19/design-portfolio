'use client'

import { useEffect, useState } from 'react'

import { randomGlyph } from '@/components/brand/led-wordmark/hooks'

export { randomGlyph, useReducedMotion, useStrays } from '@/components/brand/led-wordmark/hooks'

/**
 * Glyph cycling: after `delay`, every letter spins through random characters
 * and locks onto its own, one after another from the left. Blank until it
 * starts, so the server and the first client render agree.
 */
export function useScramble(target: string, active: boolean, delay: number, stagger = 75, spin = 420) {
  const [text, setText] = useState(() => (active ? ' '.repeat(target.length) : target))

  useEffect(() => {
    if (!active) return
    const start = performance.now() + delay
    const end = spin + target.length * stagger
    let timer = 0
    const tick = () => {
      const t = performance.now() - start
      setText(
        [...target]
          .map((ch, i) => {
            if (t < 0 || ch === ' ') return t < 0 ? ' ' : ch
            return t > spin + i * stagger ? ch : randomGlyph()
          })
          .join(''),
      )
      if (t < end) timer = window.setTimeout(tick, 55)
    }
    timer = window.setTimeout(tick, 0)
    return () => clearTimeout(timer)
  }, [target, active, delay, stagger, spin])

  return active ? text : target
}
