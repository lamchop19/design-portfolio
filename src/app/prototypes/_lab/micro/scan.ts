/**
 * Scan line: each cover carries its flight code so the CSS scan line can
 * print "SCANNED · TN25" as it passes. The animation itself is lab.css.
 */
export function scan(root: HTMLElement) {
  const covers = [...root.querySelectorAll<HTMLElement>('.tag-card')]
  for (const card of covers) {
    const code = card.querySelector('.luggage-tag-code .sr-only')?.textContent?.trim() ?? ''
    card.querySelector<HTMLElement>('.tag-card-cover')?.setAttribute('data-scan', `Scanned · ${code}`)
  }
  return () => {
    for (const card of covers) card.querySelector('.tag-card-cover')?.removeAttribute('data-scan')
  }
}
