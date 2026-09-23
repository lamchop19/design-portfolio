/**
 * Shared motion vocabulary. Everything animated reads from here so the site moves
 * like one hand. Mirrors the duration and easing custom properties in globals.css.
 */
export const duration = {
  fast: 0.15,
  base: 0.32,
  slow: 0.64,
} as const

/** Strong deceleration — motion arrives fast and settles, rather than easing in. */
export const easeOut = [0.16, 1, 0.3, 1] as const

/** For cursor-following elements: loose enough to lag visibly, tight enough to track. */
export const followSpring = {
  type: 'spring',
  stiffness: 340,
  damping: 34,
  mass: 0.8,
} as const

/** Per-item delay in staggered reveals. */
export const stagger = 0.045
