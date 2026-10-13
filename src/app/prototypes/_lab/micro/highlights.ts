const PHRASES = ['brand', 'social', 'graphic design', 'communities', 'Brands', 'Communities']

/**
 * Marker highlights: key phrases light up as their paragraph scrolls into
 * view. Uses the CSS Custom Highlight API, so it paints over the text
 * without wrapping any of it in new elements.
 */
export function highlights(root: HTMLElement) {
  if (!('highlights' in CSS)) return () => {}

  const blocks = [
    ...root.querySelectorAll<HTMLElement>('.signs-strap > p:first-child, [data-leg=cruise] h2, [data-leg=cruise] h2 + p'),
  ]
  const lit = new Highlight()
  CSS.highlights.set('lab-marker', lit)

  const rangesFor = (el: HTMLElement) => {
    const ranges: Range[] = []
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      for (const phrase of PHRASES) {
        let at = node.data.indexOf(phrase)
        while (at !== -1) {
          const range = new Range()
          range.setStart(node, at)
          range.setEnd(node, at + phrase.length)
          ranges.push(range)
          at = node.data.indexOf(phrase, at + phrase.length)
        }
      }
    }
    return ranges
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        rangesFor(entry.target as HTMLElement).forEach((range) => lit.add(range))
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -20% 0px' },
  )
  blocks.forEach((el) => observer.observe(el))

  return () => {
    observer.disconnect()
    CSS.highlights.delete('lab-marker')
  }
}
