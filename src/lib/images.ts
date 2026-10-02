import manifest from './image-manifest.json'

export type ImageEntry = {
  src: string
  width: number
  height: number
  blurDataURL: string
}

const entries = manifest as Record<string, ImageEntry>

/**
 * Look up a build-time-optimized image by its path relative to content/,
 * e.g. getImage('work/tech-nyu/cover.jpg'). Throws rather than rendering a broken
 * image, so a missing or misnamed asset fails the build instead of shipping.
 */
export function getImage(key: string): ImageEntry {
  const entry = entries[key]
  if (!entry) {
    throw new Error(
      `No optimized image for "${key}". Add it under content/ and re-run \`npm run images\`.`,
    )
  }
  return entry
}

export function hasImage(key: string): boolean {
  return key in entries
}
