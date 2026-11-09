'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/*
 * A menu that behaves like a remote's: a single highlight that glides to
 * whichever item is hovered or arrowed to, the way the selection moves on a
 * disc menu or a TV guide. Enter or a click plays it. From the DVD menu
 * prototype; the guide (components/guide) and the Chapters prototype use it.
 */

type Orientation = 'vertical' | 'horizontal' | 'grid'

/**
 * Roving selection over a row, column or grid of items. Returns the active
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
