'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * Draws its child at a fixed design size and scales it down to fit the box it
 * is given, centred. For artwork laid out in pixels, like the passport cover,
 * that has to sit in tiles of any size.
 */
export function ScaleToFit({
  width,
  height,
  className,
  children,
}: {
  width: number
  height: number
  className?: string
  children: React.ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => {
      const scale = Math.min(el.clientWidth / width, el.clientHeight / height, 1)
      el.style.setProperty('--fit', String(Math.max(scale, 0.01)))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [width, height])

  return (
    <div ref={box} className={['scale-fit', className].filter(Boolean).join(' ')}>
      <div className="scale-fit-art" style={{ width, height }}>
        {children}
      </div>
    </div>
  )
}
