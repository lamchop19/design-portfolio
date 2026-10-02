'use client'

import { useEffect, useRef } from 'react'

export function PixelCrab() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const crab = ref.current
    if (!crab) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        crab.dataset.arrived = 'true'
      }
      observer.disconnect()
    }, { threshold: 1 })
    observer.observe(crab)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="ocean-crab">
      <svg viewBox="0 0 22 16" shapeRendering="crispEdges">
        <path fill="#da6547" d="M2 2h2v2h2V0h2v6H6v2h2v2h6V8h2V6h-2V0h2v4h2V2h2v6h-4v4h-2v2H8v-2H6V8H2Z" />
        <path fill="#ef9670" d="M8 6h6v2h2v4H6V8h2Zm-6-4h2v4H2Zm16 0h2v4h-2Z" />
        <path fill="#fcdbad" d="M8 4h2v4H8Zm4 0h2v4h-2Z" />
        <path fill="#173449" d="M8 4h2v2H8Zm4 0h2v2h-2Z" />
        <path fill="#ca563f" d="M2 10h4v2H2v4H0v-4h2Zm14 0h4v2h2v4h-2v-4h-4ZM6 12h2v4H4v-2h2Zm8 0h2v2h2v2h-4Z" />
      </svg>
    </div>
  )
}
