const CRUISE = 37000

/**
 * Altimeter: scroll depth as altitude. Climbs to cruise through the middle
 * of the page and reads "Final approach" over the last stretch.
 */
export function altimeter() {
  const dial = document.createElement('div')
  dial.className = 'lab-altimeter'
  dial.setAttribute('aria-hidden', 'true')
  dial.innerHTML =
    '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" class="lab-alt-ring"/><circle cx="24" cy="24" r="21" pathLength="100" class="lab-alt-arc"/><line x1="24" y1="24" x2="24" y2="8" class="lab-alt-needle"/></svg><span class="lab-alt-read"></span>'
  document.body.appendChild(dial)
  const arc = dial.querySelector<SVGCircleElement>('.lab-alt-arc')!
  const needle = dial.querySelector<SVGLineElement>('.lab-alt-needle')!
  const read = dial.querySelector<HTMLSpanElement>('.lab-alt-read')!

  let frame = 0
  const paint = () => {
    frame = 0
    const max = document.documentElement.scrollHeight - innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0
    // Climb over the first 20%, cruise, then descend over the last 20%.
    const level = p < 0.2 ? p / 0.2 : p > 0.8 ? (1 - p) / 0.2 : 1
    const feet = Math.round((level * CRUISE) / 100) * 100
    arc.style.strokeDasharray = `${level * 100} 100`
    needle.style.rotate = `${level * 300}deg`
    read.textContent = p > 0.8 ? `Final approach · ${feet.toLocaleString('en-US')} ft` : `${feet.toLocaleString('en-US')} ft`
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint)
  }
  paint()
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule)
  return () => {
    cancelAnimationFrame(frame)
    removeEventListener('scroll', schedule)
    removeEventListener('resize', schedule)
    dial.remove()
  }
}
