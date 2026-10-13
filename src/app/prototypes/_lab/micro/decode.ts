const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789→·'

/**
 * Departure decode: on hover, a heading or link cycles through board glyphs
 * and settles left to right. Only the element's own text nodes are touched,
 * and each one is put back exactly as it was.
 */
export function decode(root: HTMLElement) {
  const targets = [
    ...root.querySelectorAll<HTMLElement>('.landing-hall h2, [data-leg=arrival] a, .tag-card p'),
  ]
  const cleanups: Array<() => void> = []

  for (const el of targets) {
    let frame = 0
    let originals: Array<[Text, string]> = []

    const restore = () => {
      cancelAnimationFrame(frame)
      frame = 0
      for (const [node, text] of originals) node.data = text
      originals = []
    }

    const start = () => {
      if (frame) return
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      originals = []
      while (walker.nextNode()) {
        const node = walker.currentNode as Text
        // Split-flap tiles are hidden duplicates of the text; leave them be.
        if (node.parentElement?.closest('[aria-hidden="true"]')) continue
        if (node.data.trim()) originals.push([node, node.data])
      }
      const begin = performance.now()
      const total = Math.max(...originals.map(([, t]) => t.length), 1)
      const tick = (now: number) => {
        const settled = Math.floor(((now - begin) / 520) * total)
        for (const [node, text] of originals) {
          node.data = [...text]
            .map((ch, i) => (i < settled || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
            .join('')
        }
        if (settled < total) frame = requestAnimationFrame(tick)
        else restore()
      }
      frame = requestAnimationFrame(tick)
    }

    el.addEventListener('pointerenter', start)
    el.addEventListener('focus', start)
    cleanups.push(() => {
      el.removeEventListener('pointerenter', start)
      el.removeEventListener('focus', start)
      restore()
    })
  }

  return () => cleanups.forEach((fn) => fn())
}
