import { renderToStaticMarkup } from 'react-dom/server'

/**
 * Bags are drawn as SVG but shown as images. Each bag is rendered once to a
 * standalone SVG document (grain, shade and shadow included) and used as an
 * <img> data URL, so the browser rasterises it a single time and the belt
 * only ever moves finished pixels. Live SVG filters on 27 moving bags were
 * what made the first version paint slowly.
 */

/** Room around each bag for its shadow and handles; the image is offset by it. */
export const PAD = 16

const cache = new Map<string, string>()

export function baked(key: string, draw: () => React.ReactElement) {
  let url = cache.get(key)
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(draw()))}`
    cache.set(key, url)
  }
  return url
}

/** The document root: the bag's own coordinates (in `unit`-pixel cells), padded on every side. */
export function Sheet({
  w,
  h,
  unit = 1,
  children,
  ...attrs
}: { w: number; h: number; unit?: number; children: React.ReactNode } & React.SVGProps<SVGSVGElement>) {
  const p = PAD / unit
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w + 2 * PAD}
      height={h + 2 * PAD}
      viewBox={`${-p} ${-p} ${w / unit + 2 * p} ${h / unit + 2 * p}`}
      {...attrs}
    >
      {children}
    </svg>
  )
}

/** A hard, unblurred drop shadow, applied with filter="url(#shadow)". */
export function Shadow({ dx, dy, opacity }: { dx: number; dy: number; opacity: number }) {
  return (
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx={dx} dy={dy} stdDeviation="0" floodColor="#000000" floodOpacity={opacity} />
    </filter>
  )
}

export function BakedImg({ src, size, className }: { src: string; size: [number, number]; className?: string }) {
  return (
    // A data-URL SVG drawn at its natural size: next/image has nothing to optimise here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size[0] + 2 * PAD}
      height={size[1] + 2 * PAD}
      draggable={false}
      decoding="async"
      className={['bc-img', className].filter(Boolean).join(' ')}
    />
  )
}
