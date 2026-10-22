import { breaker } from './breaker'
import { coastRoad } from './coast-road'
import { flowerField } from './flower-field'
import { glowReef } from './glow-reef'
import { horizon } from './horizon'
import type { Canvas, Motion } from './kit'
import { nightFlight } from './night-flight'
import { poolside } from './poolside'
import { recordStore } from './record-store'
import { reef } from './reef'

/** What a painter hands back: the motion that plays over its still, any moving layers, and how hard to grain it. */
export type Painted = { motion?: Motion; layers?: Record<string, Canvas>; noise?: number }

/** Paints one variant of a scene onto the canvas (2400 × 1350), back to front. */
export type Painter = (c: Canvas, variant: string) => Promise<Painted>

/** By scene id (src/lib/scenes.ts). */
export const PAINTERS: Record<string, Painter> = {
  breaker,
  'night-flight': nightFlight,
  'coast-road': coastRoad,
  poolside,
  horizon,
  reef,
  'glow-reef': glowReef,
  'record-store': recordStore,
  'flower-field': flowerField,
}
