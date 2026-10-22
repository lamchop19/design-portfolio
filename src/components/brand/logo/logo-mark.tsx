'use client'

import { useEffect, useRef } from 'react'

import { bindHovers, getParts, playLoad, type HoverId, type LoadId } from './effects'

import './logo.css'

/**
 * The maL mark, inline (markup from logoSvg in ./source, read on the server),
 * with a load animation and hovers on top. `hoverScope` lets an ancestor (a
 * pill, a link) set the hovers off rather than the mark alone. `label` names
 * it for screen readers; leave it out where the text beside it says the name.
 * Remount it (by key) to replay the load from a clean copy.
 */
export function LogoMark({
  svg,
  load = 'none',
  hovers = [],
  hoverScope,
  label,
  className,
}: {
  svg: string
  load?: LoadId
  hovers?: HoverId[]
  hoverScope?: string
  label?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  // Separate effects, so changing the hovers doesn't replay the load.
  useEffect(() => {
    const parts = ref.current && getParts(ref.current)
    if (!parts) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return playLoad(still ? 'none' : load, parts)
  }, [load])

  useEffect(() => {
    const host = ref.current
    const parts = host && getParts(host)
    if (!host || !parts || !hovers.length) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const trigger = (hoverScope && host.closest<HTMLElement>(hoverScope)) || host
    return bindHovers(trigger, parts, hovers, still)
  }, [hovers, hoverScope])

  return (
    <span
      ref={ref}
      className={['mal-mark', className].filter(Boolean).join(' ')}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
