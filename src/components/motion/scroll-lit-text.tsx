type ScrollLitTextProps = {
  children: string
  className?: string
  as?: 'p' | 'h2'
}

/**
 * A paragraph that is read into ink: it starts pale and each word darkens in
 * turn as the paragraph scrolls up through the window (after Air's About page).
 *
 * Like RevealText, a server component with no client JS: the words are spans
 * with their index, and the lighting is a scroll-driven animation in
 * globals.css (.lit-word). Without scroll timelines, or with reduced motion,
 * the text is simply ink. The words stay real text, so it reads as written.
 */
export function ScrollLitText({ children, className, as: Tag = 'p' }: ScrollLitTextProps) {
  const words = children.split(' ')

  return (
    <Tag className={['lit-text', className].filter(Boolean).join(' ')} style={{ '--n': words.length } as React.CSSProperties}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="lit-word" style={{ '--i': i } as React.CSSProperties}>
          {i < words.length - 1 ? `${word} ` : word}
        </span>
      ))}
    </Tag>
  )
}
