import { asset } from './paths'

/**
 * Paths to the cards written by scripts/generate-og.tsx. Kept in one place so the
 * naming stays in step with the generator.
 */
export function ogImage(name: 'index' | `work-${string}`) {
  return asset(`/og/${name}.png`)
}
