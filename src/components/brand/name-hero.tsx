import { RevealText } from '@/components/motion/reveal-text'

/**
 * The wordmark: the name, set large across the columns it is given. With
 * `animate` it rises word by word out of its mask on load (RevealText, CSS
 * only, so it paints with the first frame); off while the site is static.
 */
export function NameHero({ name, className, animate = false }: { name: string; className?: string; animate?: boolean }) {
  const classes = ['name-hero', className].filter(Boolean).join(' ')
  if (!animate) return <h1 className={classes}>{name}</h1>
  return (
    <RevealText as="h1" className={classes}>
      {name}
    </RevealText>
  )
}
