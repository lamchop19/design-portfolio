type ScanlineTextProps = {
  children: string
  className?: string
  id?: string
  as?: 'h2' | 'h3' | 'p' | 'span'
}

/**
 * Type that prints in through scanlines (after Anima's headings): it arrives
 * as thin horizontal bands, with every other band slid sideways, and the gaps
 * close up as it scrolls into view until it is solid.
 *
 * CSS only (globals.css, .scanline). The second copy carries the odd bands and
 * is hidden from assistive tech; without scroll timelines, or with reduced
 * motion, the heading is plain text.
 */
export function ScanlineText({ children, className, id, as: Tag = 'h2' }: ScanlineTextProps) {
  return (
    <Tag id={id} className={['scanline', className].filter(Boolean).join(' ')}>
      <span className="scanline-even">{children}</span>
      <span className="scanline-odd" aria-hidden="true">
        {children}
      </span>
    </Tag>
  )
}
