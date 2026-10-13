/**
 * Boarding cursor: over a project the pointer becomes a pill naming the
 * flight; over the email it says "Write". Fine pointers only. Phones keep
 * their taps as they are.
 */
export function cursor(root: HTMLElement) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}

  const pill = document.createElement('div')
  pill.className = 'lab-cursor'
  pill.setAttribute('aria-hidden', 'true')
  document.body.appendChild(pill)

  let x = 0
  let y = 0
  let px = 0
  let py = 0
  let frame = 0

  const follow = () => {
    // Ease toward the pointer so the pill trails a touch behind it.
    px += (x - px) * 0.28
    py += (y - py) * 0.28
    pill.style.translate = `${px}px ${py}px`
    frame = Math.abs(x - px) + Math.abs(y - py) > 0.3 ? requestAnimationFrame(follow) : 0
  }

  const label = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return ''
    const card = target.closest('.tag-card')
    if (card) {
      const code = card.querySelector('.luggage-tag-code .sr-only')?.textContent?.trim()
      return code ? `Board ${code} →` : 'Board →'
    }
    if (target.closest('a[href^="mailto"]')) return 'Write ✉'
    return ''
  }

  const move = (event: PointerEvent) => {
    x = event.clientX
    y = event.clientY
    const text = label(event.target)
    pill.dataset.on = text ? 'true' : 'false'
    if (text && pill.textContent !== text) pill.textContent = text
    if (!frame) frame = requestAnimationFrame(follow)
  }

  // Scrolling moves the page under a still pointer, so the label would go
  // stale; hide it until the pointer moves again.
  const hide = () => {
    pill.dataset.on = 'false'
  }

  root.addEventListener('pointermove', move)
  root.addEventListener('pointerleave', hide)
  addEventListener('scroll', hide, { passive: true })
  root.classList.add('lab-has-cursor')
  return () => {
    cancelAnimationFrame(frame)
    root.removeEventListener('pointermove', move)
    root.removeEventListener('pointerleave', hide)
    removeEventListener('scroll', hide)
    root.classList.remove('lab-has-cursor')
    pill.remove()
  }
}
