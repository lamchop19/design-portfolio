'use client'

import { motion, useReducedMotion } from 'motion/react'

import { duration, easeOut, stagger } from '@/lib/motion'

type RevealTextProps = {
  children: string
  className?: string
  as?: 'h1' | 'h2' | 'p'
  /** Animate on scroll into view instead of on mount. */
  onScroll?: boolean
  delay?: number
}

/**
 * Splits a string into words and rises each out of a clip mask with a stagger.
 * Under reduced motion the mask and offset are dropped and the text simply fades,
 * which keeps the entrance without any positional movement.
 */
export function RevealText({
  children,
  className,
  as = 'h1',
  onScroll = false,
  delay = 0,
}: RevealTextProps) {
  const reduced = useReducedMotion()
  const words = children.split(' ')
  const Tag = motion[as]

  const animateProps = onScroll
    ? { whileInView: 'visible', viewport: { once: true, margin: '-15%' } }
    : { animate: 'visible' }

  return (
    <Tag
      className={className}
      initial="hidden"
      {...animateProps}
      transition={{ staggerChildren: reduced ? 0 : stagger, delayChildren: delay }}
      // The words are the accessible text; the spans are purely presentational.
      aria-label={children}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden
          // inline-flex + overflow-hidden forms the mask each word rises out of.
          className="inline-flex overflow-hidden align-bottom"
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: reduced ? 0 : '110%', opacity: reduced ? 0 : 1 },
              visible: { y: 0, opacity: 1 },
            }}
            transition={{ duration: duration.slow, ease: easeOut }}
          >
            {word}
            {i < words.length - 1 ? ' ' : null}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
