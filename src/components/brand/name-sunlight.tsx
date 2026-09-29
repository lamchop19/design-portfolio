'use client'

import { useEffect, useRef } from 'react'

/**
 * Hover light for the wordmark. The heading is server-rendered and complete on
 * its own; this only feeds the pointer position to CSS (see `.name-hero-wrap`
 * in globals.css) and corrects the width fit once the display font has loaded.
 */
export function NameSunlight() {
  const glowRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const wrapper = glowRef.current?.parentElement
    const text = wrapper?.querySelector<HTMLElement>('.name-hero-text')
    if (!wrapper || !text) return
    let alive = true
    let frame = 0
    let x = 0
    let y = 0

    function place() {
      wrapper!.style.setProperty('--sun-x', `${x}px`)
      wrapper!.style.setProperty('--sun-y', `${y}px`)
    }

    function track(event: PointerEvent) {
      const bounds = wrapper!.getBoundingClientRect()
      x = event.clientX - bounds.left
      y = event.clientY - bounds.top
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(place)
    }

    function enter(event: PointerEvent) {
      if (event.pointerType === 'touch') return
      track(event)
      wrapper!.dataset.sun = 'on'
    }

    function leave() {
      delete wrapper!.dataset.sun
    }

    // The CSS ships a measured em-width for the name so the first paint already
    // spans the viewport. Re-measuring keeps the fit exact if the name changes.
    void document.fonts.ready.then(() => {
      if (!alive) return
      const size = parseFloat(getComputedStyle(text).fontSize)
      if (size) wrapper.style.setProperty('--name-em', String(text.getBoundingClientRect().width / size))
    })

    wrapper.addEventListener('pointerenter', enter)
    wrapper.addEventListener('pointermove', track)
    wrapper.addEventListener('pointerleave', leave)
    wrapper.addEventListener('pointercancel', leave)

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      wrapper.removeEventListener('pointerenter', enter)
      wrapper.removeEventListener('pointermove', track)
      wrapper.removeEventListener('pointerleave', leave)
      wrapper.removeEventListener('pointercancel', leave)
    }
  }, [])

  return <span ref={glowRef} className="name-sun-glow" aria-hidden="true" />
}
