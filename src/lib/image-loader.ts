'use client'

/**
 * Custom next/image loader for the static export.
 *
 * `scripts/optimize-images.mjs` emits one file per width in IMAGE_WIDTHS, named by
 * that width, so this can be pure arithmetic — no manifest lookup, nothing extra
 * shipped to the browser. `src` arrives as "/img/work/<slug>/cover.avif"; the real
 * files live at "/img/work/<slug>/cover/<width>.avif".
 */
export default function imageLoader({ src, width }: { src: string; width: number }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

  // Anything not produced by our pipeline (e.g. an SVG in public/) passes through.
  if (!src.startsWith('/img/')) return `${basePath}${src}`

  const dot = src.lastIndexOf('.')
  const stem = src.slice(0, dot)
  const ext = src.slice(dot + 1)
  return `${basePath}${stem}/${width}.${ext}`
}
