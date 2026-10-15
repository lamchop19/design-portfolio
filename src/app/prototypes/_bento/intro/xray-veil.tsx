'use client'

/**
 * Security screening: a layer that shows the page underneath as an x-ray
 * (all done with backdrop-filter, so it is the real page) slides down off the
 * screen, a scanner bar riding its top edge. What the bar has passed is in
 * full colour. `onDone` fires when it's gone.
 */
export function XrayVeil({ delay, onDone }: { delay: number; onDone: () => void }) {
  return (
    <div
      className="xray-veil"
      aria-hidden="true"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onDone()
      }}
    >
      <span className="xray-bar">
        <span className="xray-label t-label">Screening</span>
      </span>
    </div>
  )
}
