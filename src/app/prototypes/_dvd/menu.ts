'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/*
 * The DVD menu's sections and the one behaviour every layout shares: a single
 * highlight that glides to whichever item is hovered or arrowed to, the way a
 * remote moves the selection on a disc menu. Enter or a click plays it.
 */

export type SectionId = 'work' | 'experience' | 'about' | 'contact'

export type Section = {
  id: SectionId
  label: string
  /** What a disc would call it. */
  disc: string
  /** The neon the highlight turns when it lands here, and an ink that reads on it. */
  color: string
  on: string
}

/* Neons from the Rio Hostel fish: pink, yellow, green, electric blue. */
export const SECTIONS: Section[] = [
  { id: 'work', label: 'Featured Work', disc: 'Scene Selection', color: '#ff3d9a', on: '#120a10' },
  { id: 'experience', label: 'Experience', disc: 'Special Features', color: '#f2ff3a', on: '#14160a' },
  { id: 'about', label: 'About', disc: 'Director’s Commentary', color: '#25e46b', on: '#06170d' },
  { id: 'contact', label: 'Contact', disc: 'Set Up', color: '#2a5bff', on: '#ffffff' },
]

/** How long a screen takes to dissolve before the next comes up. Matches --dvd-cut in dvd.css. */
export const CUT_MS = 420

type Orientation = 'vertical' | 'horizontal' | 'grid'

/**
 * Roving selection over a row, column or grid of buttons. Returns the active
 * index, props for the list (items use itemProps), and a ref for the highlight, which
 * is moved by measuring the active item so it slides rather than jumps.
 */
export function useMenu(count: number, orientation: Orientation, columns = 2, initial = 0) {
  const [active, setActive] = useState(initial)
  const listRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLSpanElement>(null)

  // Items are found in the DOM rather than kept in refs, so render never touches a ref.
  const items = () => listRef.current?.querySelectorAll<HTMLElement>('[data-menu-item]') ?? []

  const place = useCallback(() => {
    const item = listRef.current?.querySelector<HTMLElement>('[data-menu-item][data-active]')
    const hl = highlightRef.current
    if (!item || !hl) return
    hl.style.transform = `translate(${item.offsetLeft}px, ${item.offsetTop}px)`
    hl.style.width = `${item.offsetWidth}px`
    hl.style.height = `${item.offsetHeight}px`
  }, [])

  useLayoutEffect(place, [active, place])

  // Fonts landing and resizes both move the items.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new ResizeObserver(place)
    observer.observe(list)
    document.fonts?.ready.then(place)
    return () => observer.disconnect()
  }, [place])

  const move = (next: number) => {
    const i = (next + count) % count
    setActive(i)
    items()[i]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1 }[event.key]
    if (step === undefined) return
    const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown'
    if (orientation === 'vertical' && !vertical) return
    if (orientation === 'horizontal' && vertical) return
    event.preventDefault()
    move(active + (orientation === 'grid' && vertical ? step * columns : step))
  }

  return {
    active,
    highlightRef,
    setActive,
    listProps: { ref: listRef, onKeyDown },
  }
}

/** Props for item i of a menu: roving tab stop, active flag, and hover or focus to select. */
export function itemProps(i: number, active: number, setActive: (i: number) => void) {
  return {
    'data-menu-item': '',
    tabIndex: i === active ? 0 : -1,
    'data-active': i === active || undefined,
    onPointerEnter: () => setActive(i),
    onFocus: () => setActive(i),
  }
}

/** Custom properties that tint the highlight and the active item with a section's neon. */
export const tint = (section: Section) =>
  ({ '--hl': section.color, '--on-hl': section.on }) as React.CSSProperties
