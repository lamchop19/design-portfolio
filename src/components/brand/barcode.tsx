/**
 * A decorative barcode generated from a string, so each project's pass always
 * carries the same bars. Drawn in currentColor, stretched to its box.
 */
export function Barcode({ value, className }: { value: string; className?: string }) {
  // FNV-1a seeds a small LCG; each step yields one bar or gap width of 1–3 units.
  let seed = 2166136261
  for (const ch of value) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return 1 + (seed >>> 29) % 3
  }

  const bars: Array<[x: number, w: number]> = []
  let x = 0
  for (let i = 0; i < 28; i++) {
    const w = next()
    bars.push([x, w])
    x += w + next()
  }

  return (
    <svg
      viewBox={`0 0 ${x} 10`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      {bars.map(([bx, w]) => (
        <rect key={bx} x={bx} width={w} height="10" />
      ))}
    </svg>
  )
}
