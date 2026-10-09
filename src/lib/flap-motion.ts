/**
 * Alternative flip timing for split-flap tiles, under evaluation in
 * /prototypes/flip. A flap is a leaf falling under gravity: it leaves the top
 * slowly and is moving fastest when it slams into the stop, so every curve
 * here is an ease-in, applied once across the leaf's whole 180° fall and shared
 * by the two halves that draw it.
 */
export type FlapMotion = {
  /** Milliseconds for a flip on the way through the drum. */
  step: number
  /** Milliseconds for the last flip, which lands and rebounds. */
  land: number
  /** Progress through the fall, 0–1 in and out. Omit to keep the stock curves. */
  ease?: (t: number) => number
}

const expo = (k: number) => (t: number) => (2 ** (k * t) - 1) / (2 ** k - 1)

export const flapEases = {
  sine: { label: 'Sine in', formula: '1 − cos(πt/2)', fn: (t: number) => 1 - Math.cos((t * Math.PI) / 2) },
  quad: { label: 'Quad in', formula: 't²', fn: (t: number) => t * t },
  cubic: { label: 'Cubic in', formula: 't³', fn: (t: number) => t ** 3 },
  expo: { label: 'Expo in', formula: '(2⁶ᵗ − 1) / 63', fn: expo(6) },
  expoStrong: { label: 'Expo in, strong', formula: '(2¹⁰ᵗ − 1) / 1023', fn: expo(10) },
} as const

export type FlapEase = keyof typeof flapEases

/** The stock timing, for scaling from. */
export const FLAP_STEP_MS = 55
export const FLAP_LAND_MS = 130

/** When the leaf passes vertical, i.e. where the top half hands over to the bottom. */
export function halfway(ease: (t: number) => number) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (ease(mid) < 0.5) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

const SAMPLES = 16
/** Share of a landing flip spent falling; the rest is the rebound off the stop. */
const FALL_SHARE = 0.8

/**
 * Keyframes for both leaves of one flip, sampled from `ease` so the top leaf's
 * first 90° and the bottom leaf's last 90° read as one continuous fall.
 */
export function fallKeyframes(ease: (t: number) => number, land: boolean, shade: boolean) {
  const span = land ? FALL_SHARE : 1
  const mid = halfway(ease)
  const lit = (b: number) => (shade ? { filter: `brightness(${b.toFixed(3)})` } : {})

  const top: Keyframe[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (mid * i) / SAMPLES
    const p = Math.min(ease(t), 0.5)
    top.push({ offset: t * span, transform: `rotateX(${(-180 * p).toFixed(2)}deg)`, ...lit(1 - p) })
  }
  top.push({ offset: 1, transform: 'rotateX(-90deg)', ...lit(0.5) })

  const bottom: Keyframe[] = [{ offset: 0, transform: 'rotateX(90deg)', ...lit(0.55) }]
  for (let i = 0; i <= SAMPLES; i++) {
    const t = mid + ((1 - mid) * i) / SAMPLES
    const p = Math.max(ease(t), 0.5)
    bottom.push({ offset: t * span, transform: `rotateX(${(180 - 180 * p).toFixed(2)}deg)`, ...lit(0.55 + 0.9 * (p - 0.5)) })
  }
  if (land) {
    bottom[bottom.length - 1].easing = 'ease-out'
    bottom.push(
      { offset: span + (1 - span) * 0.45, transform: 'rotateX(12deg)', ...lit(0.92), easing: 'ease-in' },
      { offset: 1, transform: 'rotateX(0deg)', ...lit(1) },
    )
  }
  return { top, bottom }
}
