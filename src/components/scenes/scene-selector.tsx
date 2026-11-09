'use client'

import { useEffect } from 'react'

import { BACKDROP_SCENES, choiceId, choiceLook, type SceneChoice } from '@/lib/scene-choice'
import { SCENES } from '@/lib/scenes'

import { setScene, useScene } from './use-scene'

import './scene-selector.css'

/**
 * The scene boxes, after the four squares in the wireframe's top right: a
 * thumbnail of each scene, numbered like a channel, that swaps the picture
 * behind the site (./scene-backdrop) and remembers it. A radio group, so
 * arrows move between boxes; 1–4 change channel from anywhere on the page.
 * `axis` lays the boxes in a column or a row (always a row on phones).
 */
export function SceneSelector({
  choices = BACKDROP_SCENES,
  axis = 'column',
  className,
}: {
  choices?: SceneChoice[]
  axis?: 'column' | 'row'
  className?: string
}) {
  const current = useScene()
  const ids = choices.map(choiceId)
  const checked = ids.indexOf(current)
  const key = ids.join(' ')

  // Number keys change channel, unless they're being typed somewhere.
  useEffect(() => {
    const list = key.split(' ')
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return
      const n = Number(event.key)
      if (Number.isInteger(n) && n >= 1 && n <= list.length) setScene(list[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = (Math.max(0, checked) + step + ids.length) % ids.length
    setScene(ids[next])
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Background scene" className={['ss', className].filter(Boolean).join(' ')} data-axis={axis} onKeyDown={onKeyDown}>
      {choices.map((choice, i) => {
        const id = ids[i]
        const { src, position } = choiceLook(choice)
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={id === current}
            tabIndex={id === current || (checked < 0 && i === 0) ? 0 : -1}
            className="ss-box"
            style={{ '--thumb': `url("${src}")`, '--thumb-pos': position } as React.CSSProperties}
            onClick={() => setScene(id)}
          >
            <span className="ss-num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="ss-name t-label">{SCENES.find((s) => s.id === choice.scene)?.name ?? choice.scene}</span>
          </button>
        )
      })}
    </div>
  )
}
