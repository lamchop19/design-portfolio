'use client'

import { useEffect, useState } from 'react'

/** How long each word stays on, and how many times round the list goes before settling on the first. */
const HOLD = 2600
const LAPS = 2

/**
 * The word at the end of the homepage's sentence, changing like a channel on
 * the wireframe's blank: the old word breaks into a dot screen and the next
 * resolves out of one. Every word shares one grid cell, so the slot is as
 * wide as the longest and the centred line never reflows. It pauses while
 * pointed at, settles on the first word after a couple of laps, and holds
 * still under reduced motion. Screen readers get the whole list.
 */
export function ChannelWord({ words }: { words: string[] }) {
  const [on, setOn] = useState(0)
  const [changes, setChanges] = useState(0)
  const [paused, setPaused] = useState(false)
  const done = changes >= words.length * LAPS

  useEffect(() => {
    if (paused || done || words.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(() => {
      setOn((i) => (i + 1) % words.length)
      setChanges((n) => n + 1)
    }, HOLD)
    return () => clearTimeout(timer)
  }, [on, paused, done, words.length])

  return (
    <span className="cw" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <span className="cw-slot" aria-hidden="true">
        {words.map((word, i) => (
          <span key={word} className="cw-word" data-on={i === on || undefined}>
            {word}
          </span>
        ))}
      </span>
      <span className="sr-only">{new Intl.ListFormat('en', { type: 'conjunction' }).format(words)}</span>
    </span>
  )
}
