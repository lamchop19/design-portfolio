import { SplitFlap } from '@/components/split-flap/split-flap'
import type { FlapMotion } from '@/lib/flap-motion'

type Stack = 'never' | 'narrow' | 'always'

/**
 * The wordmark: the name as split-flap glyphs filling the width it is given.
 * It sets on one row, or stacked one word per row (MARC / ANDRE / LAM) —
 * always, never, or only on narrow screens where one row would be too small.
 * It cascades into place on load, and letters flick over under the pointer.
 * On a session's first visit the single row greets first — WELCOME ABOARD,
 * the same fourteen tiles — then turns over to the name. The heading's
 * accessible text is the plain name; the tiles are decorative.
 */
export function NameHero({
  name,
  stack = 'narrow',
  motion,
  intro,
  className,
}: {
  name: string
  stack?: Stack
  /** Flip timing, for trying alternatives (see /prototypes/flip). */
  motion?: FlapMotion
  intro?: 'auto' | 'quick' | 'full'
  className?: string
}) {
  // Stacked, each word is padded to the longest so every row starts flush left.
  const words = name.split(' ')
  const width = Math.max(...words.map((word) => word.length))
  const stacked = words.map((word) => word.padEnd(width)).join('')

  return (
    <h1
      className={['flap-wordmark', className].filter(Boolean).join(' ')}
      data-stack={stack}
      style={{ '--stack-cols': width } as React.CSSProperties}
    >
      <span className="sr-only">{name}</span>
      {stack !== 'always' && (
        <SplitFlap
          text={name}
          preroll="Welcome aboard"
          trigger="load"
          delay={250}
          ripple
          motion={motion}
          intro={intro}
          className="flap-wordmark-row"
        />
      )}
      {stack !== 'never' && (
        <SplitFlap
          text={stacked}
          trigger="load"
          delay={250}
          ripple
          motion={motion}
          intro={intro}
          className="flap-wordmark-stack"
        />
      )}
    </h1>
  )
}
