/**
 * The character drum every split-flap tile carries. A tile can only step forward
 * through it, so the distance from one character to the next decides how long
 * that tile keeps flipping — which is what staggers a board without any
 * scripted delays. Characters outside the drum are shown by a single flip.
 */
export const FLAP_DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&@.-/:'"

/** Clock tiles carry digits only, so a minute ticks over in a single flip. */
export const CLOCK_DRUM = ' 0123456789-'

// Runs in the document head before paint. When motion is allowed, split-flap
// text starts as blank tiles until its component takes over, so the finished
// letters never flash before the cascade. Without JS the attribute never
// appears and the server-rendered text simply shows.
export const flapInitScript = `try {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.dataset.flap = 'pending';
} catch {}`
