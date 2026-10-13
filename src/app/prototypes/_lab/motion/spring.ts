import { animate, hover, inView, press, stagger } from 'motion'

/**
 * The spring suite, driven by the Motion library on the existing DOM:
 * covers and sign plates lift on a spring, buttons squash when pressed, and
 * each leg's headings, paragraphs and cards stagger in the first time it's
 * seen. Everything it sets is cleared when the suite is switched off.
 */
export function spring(root: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const touched = new Set<HTMLElement>()
  const track = <T extends Element>(els: Iterable<T>) => {
    for (const el of els) touched.add(el as unknown as HTMLElement)
  }
  const bounce = { type: 'spring', stiffness: 380, damping: 18 } as const

  const stopHover = hover(root.querySelectorAll('.tag-card, .sign-plate'), (el) => {
    track([el])
    animate(el, { y: -6, scale: 1.02 }, bounce)
    return () => animate(el, { y: 0, scale: 1 }, bounce)
  })

  const stopPress = press(root.querySelectorAll('.landing-hall button, .tag-card'), (el) => {
    track([el])
    animate(el, { scale: 0.96 }, { type: 'spring', stiffness: 600, damping: 20 })
    return () => animate(el, { scale: 1 }, bounce)
  })

  const legs = root.querySelectorAll<HTMLElement>('[data-leg]:not([data-leg=gate])')
  const stops = [...legs].map((leg) =>
    inView(
      leg,
      () => {
        const parts = leg.querySelectorAll<HTMLElement>('h2, h2 + p, .tag-card, table, .flight-board')
        track(parts)
        animate(parts, { opacity: [0, 1], y: [28, 0] }, { delay: stagger(0.07), type: 'spring', stiffness: 200, damping: 24 })
      },
      { amount: 0.2 },
    ),
  )

  return () => {
    stopHover()
    stopPress()
    stops.forEach((stop) => stop())
    for (const el of touched) {
      el.style.transform = ''
      el.style.opacity = ''
    }
  }
}
