/**
 * The brand grid band — the artwork the site's palette comes from.
 *
 * An 8-cell unit repeating across the full width, two rows deep:
 *
 *   row 0:  B . P . . G B .
 *   row 1:  . B . P G . . B
 *
 * Each row is a single repeating-linear-gradient (see .pixel-row-* in
 * globals.css), so a full-width band costs two elements and no images. The blank
 * cells are transparent rather than white, so the band sits on whatever surface
 * it's placed on and inverts correctly in dark mode.
 */
type PixelGridProps = {
  /** Render only the first row — for use as a section rule rather than a band. */
  single?: boolean
  className?: string
}

export function PixelGrid({ single = false, className }: PixelGridProps) {
  return (
    <div aria-hidden className={className}>
      <div className="pixel-row-0" />
      {single ? null : <div className="pixel-row-1" />}
    </div>
  )
}
