import { useId } from 'react'

import { roundedPath, type Bands, type Mark } from './marks'

/**
 * A mark's tracks as an SVG group, in the mark's own viewBox units, so it can
 * be placed, scaled or rotated inside another drawing. Each route is stroked
 * wide in white into a mask, then narrower strokes cut the channels: one down
 * the middle for two lanes, or an inner cut with a centre lane put back for
 * three. The fill is a plain rect through that mask, so the mark takes any
 * colour.
 */
export function TrackGroup({
  mark,
  bands = 'double',
  color = 'currentColor',
  transform,
}: {
  mark: Mark
  bands?: Bands
  color?: string
  transform?: string
}) {
  const id = useId().replace(/:/g, '')
  const [w, h] = mark.viewBox
  const W = mark.width
  const paths = mark.routes.map((route) => roundedPath(route, mark.radius))
  const ring = mark.ring
  // Routes may run well past the viewBox (fin stripes do), so the mask and
  // fill cover a generous margin around it.
  const m = Math.max(w, h) * 2
  const stroke = (width: number, colour: 'white' | 'black') => (
    <g fill="none" stroke={colour} strokeWidth={width} strokeLinejoin="round" strokeLinecap="butt">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {ring ? <circle cx={ring.at[0]} cy={ring.at[1]} r={ring.r} /> : null}
    </g>
  )

  return (
    <g transform={transform}>
      <defs>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x={-m} y={-m} width={w + m * 2} height={h + m * 2}>
          {stroke(W, 'white')}
          {mark.solids?.map((s, i) =>
            s.kind === 'polygon' ? (
              <polygon key={i} points={s.points.map((p) => p.join(',')).join(' ')} fill="white" />
            ) : (
              <circle key={i} cx={s.at[0]} cy={s.at[1]} r={s.r} fill="white" />
            ),
          )}
          {bands === 'double' ? stroke(W * 0.24, 'black') : null}
          {bands === 'triple' ? (
            <>
              {stroke(W * 0.68, 'black')}
              {stroke(W * 0.26, 'white')}
            </>
          ) : null}
        </mask>
      </defs>
      <rect x={-m} y={-m} width={w + m * 2} height={h + m * 2} fill={color} mask={`url(#m${id})`} />
    </g>
  )
}

/** Draws a mark as tracks in its own SVG, optionally on a rounded tile. */
export function TrackMark({
  mark,
  bands = 'double',
  color = 'currentColor',
  tile,
  className,
  title,
}: {
  mark: Mark
  bands?: Bands
  color?: string
  /** Set the mark on a rounded tile of this colour (the mark then draws in `color`). */
  tile?: string
  className?: string
  title?: string
}) {
  const [w, h] = mark.viewBox

  // Tile marks are inset so the tracks clear the tile's corners.
  const pad = tile ? Math.max(w, h) * 0.2 : 0
  const box = `${-pad} ${-pad - (Math.max(w, h) - h) / 2} ${Math.max(w, h) + pad * 2} ${Math.max(w, h) + pad * 2}`

  return (
    <svg
      viewBox={tile ? box : `0 0 ${w} ${h}`}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {tile ? (
        <rect
          x={-pad}
          y={-pad - (Math.max(w, h) - h) / 2}
          width={Math.max(w, h) + pad * 2}
          height={Math.max(w, h) + pad * 2}
          rx={(Math.max(w, h) + pad * 2) * 0.22}
          fill={tile}
        />
      ) : null}
      <TrackGroup mark={mark} bands={bands} color={color} />
    </svg>
  )
}
