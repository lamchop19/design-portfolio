import { LedWordmark } from '@/components/brand/led-wordmark/led-wordmark'
import { SplitFlap } from '@/components/split-flap/split-flap'
import type { FlapMotion } from '@/lib/flap-motion'

type Stack = 'never' | 'narrow' | 'always'
type Face = 'flap' | 'led'

/**
 * The wordmark: the name as split-flap glyphs filling the width it is given.
 * It sets on one row, or stacked one word per row (MARC / ANDRE / LAM) —
 * always, never, or only on narrow screens where one row would be too small.
 * It cascades into place on load, and letters flick over under the pointer.
 * On a session's first visit the single row greets first — WELCOME ABOARD,
 * the same fourteen tiles — then turns over to the name. The heading's
 * accessible text is the plain name; the tiles are decorative.
 *
 * `face="led"` draws the name on a 5 × 7 lamp board instead (see
 * `LedWordmark`): it resolves lamp by lamp on load, reacts to the pointer and
 * runs its own idle sequence. It skips the greeting and doesn't call
 * `onSettle`.
 */
export function NameHero({
  name,
  face = 'flap',
  stack = 'narrow',
  motion,
  intro,
  onSettle,
  loadDelay,
  className,
}: {
  name: string
  face?: Face
  stack?: Stack
  /** Flip timing, for trying alternatives (see /prototypes/flip). */
  motion?: FlapMotion
  intro?: 'auto' | 'quick' | 'full'
  /** Called once the name has landed (after the greeting, on a first visit). */
  onSettle?: () => void
  /** LED face: wait before resolving on load, in ms. */
  loadDelay?: number
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
      {face === 'led' ? (
        <>
          {stack !== 'always' && <LedWordmark text={name} field spill loadDelay={loadDelay} className="flap-wordmark-row" />}
          {stack !== 'never' && (
            <span className="flap-wordmark-stack led-wordmark-stack">
              {words.map((word) => (
                <LedWordmark key={word} text={word.padEnd(width)} loadDelay={loadDelay} />
              ))}
            </span>
          )}
        </>
      ) : null}
      {face === 'flap' && stack !== 'always' && (
        <SplitFlap
          text={name}
          preroll="Welcome aboard"
          trigger="load"
          delay={250}
          ripple
          motion={motion}
          intro={intro}
          onSettle={onSettle}
          className="flap-wordmark-row"
        />
      )}
      {face === 'flap' && stack !== 'never' && (
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
