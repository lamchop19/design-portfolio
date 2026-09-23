import type { JSX } from 'react'

type RevealTextProps = {
  children: string
  className?: string
  as?: 'h1' | 'h2' | 'p'
  /** Drive the reveal from scroll position instead of page load. */
  onScroll?: boolean
}

/**
 * Splits a string into words and rises each out of a clip mask with a stagger.
 *
 * Deliberately a server component with no client JS: the hero headline is the
 * LCP element, and animating it with a JS library would hold the largest paint
 * until hydration. The animation lives in globals.css (.reveal-word).
 *
 * The words stay real text nodes, so this needs no aria-label — assistive tech
 * reads the heading exactly as written.
 */
export function RevealText({
  children,
  className,
  as: Tag = 'h1',
  onScroll = false,
}: RevealTextProps) {
  const words = children.split(' ')

  return (
    <Tag className={[className, onScroll ? 'reveal-on-scroll' : null].filter(Boolean).join(' ')}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="reveal-word"
          style={{ '--i': i } as React.CSSProperties}
        >
          <span>{i < words.length - 1 ? `${word} ` : word}</span>
        </span>
      ))}
    </Tag>
  )
}
