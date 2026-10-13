import { animate } from 'motion'

/**
 * Magnetic plates: sign plates and buttons lean a few pixels toward the
 * pointer while it's near, then spring home when it leaves.
 */
export function magnetic(root: HTMLElement) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}

  const targets = [...root.querySelectorAll<HTMLElement>('.sign-plate, .landing-hall button')]
  const cleanups: Array<() => void> = []

  for (const el of targets) {
    const move = (event: PointerEvent) => {
      const box = el.getBoundingClientRect()
      const dx = (event.clientX - (box.left + box.width / 2)) / box.width
      const dy = (event.clientY - (box.top + box.height / 2)) / box.height
      animate(el, { x: dx * 10, y: dy * 8 }, { type: 'spring', stiffness: 400, damping: 22 })
    }
    const leave = () => {
      animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 300, damping: 14 })
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    cleanups.push(() => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      el.style.transform = ''
    })
  }

  return () => cleanups.forEach((fn) => fn())
}
