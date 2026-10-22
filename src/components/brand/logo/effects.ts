/*
 * Load and hover effects for the maL mark. They work on the Figma export
 * (public/logo/mal-*.svg, placed inline by logoSvg in ./source): the three
 * letters are paths with their own brand-to-white gradients, one noise filter
 * stipples ink over all three, and "marc andre lam" is twelve dot-matrix
 * letter paths. Every effect either moves those paths or animates the
 * gradient and noise attributes the export already has. Used by the site's
 * intro and frame (./logo-intro, ./logo-mark) and by /prototypes/logo.
 */

export type Parts = {
  svg: SVGSVGElement
  /** Prefix for the ids these effects add, so two marks on a page don't collide. */
  ns: string
  /** The whole mark: monogram and the name under it. */
  root: SVGGElement
  /** The monogram group, which carries the noise filter. */
  group: SVGGElement
  /** m, a, L in reading order. */
  letters: SVGPathElement[]
  /** The twelve letters of "marc andre lam". */
  name: SVGPathElement[]
  filter: SVGFilterElement
  turbulence: SVGFETurbulenceElement
  /** The threshold that decides how much of the noise turns into ink. */
  grain: SVGFEFuncAElement
  /** The letters' gradients: m, L, a in the export's order. */
  gradients: SVGLinearGradientElement[]
  /** The noise's ink: the flood that colours the stipple. */
  ink: SVGFEFloodElement
}

const NS = 'http://www.w3.org/2000/svg'

export function getParts(host: HTMLElement): Parts | null {
  const svg = host.querySelector('svg')
  const group = svg?.querySelector<SVGGElement>('[id="Group 6"]')
  if (!svg || !group) return null
  const byId = (id: string) => svg.querySelector<SVGPathElement>(`[id="${id}"]`)!
  return {
    svg,
    ns: svg.dataset.ns ?? 'lg',
    root: svg.querySelector('g')!,
    group,
    letters: [byId('Vector'), byId('Vector_3'), byId('Vector_2')],
    name: [...svg.querySelectorAll<SVGPathElement>('[id="marc andre lam"] path')],
    filter: svg.querySelector('filter')!,
    turbulence: svg.querySelector('feTurbulence')!,
    grain: svg.querySelector('feFuncA')!,
    gradients: [...svg.querySelectorAll('linearGradient')],
    ink: svg.querySelector<SVGFEFloodElement>('feFlood[flood-color]')!,
  }
}

/** Out of 100 noise levels, how many become ink. The export ships 51. */
export function setGrain(funcA: SVGFEFuncAElement, coverage: number) {
  const n = Math.round(Math.min(1, Math.max(0, coverage)) * 100)
  funcA.setAttribute('tableValues', `${'1 '.repeat(n)}${'0 '.repeat(100 - n)}`.trim())
}

/**
 * The export clips its noise to a box around the letters at rest (y 11.8 to
 * 106), so anything that moves them would be cut off. Grow it only as far as
 * an animation needs: the noise is regenerated over the whole box every frame.
 * At rest it renders the same.
 */
export function widenFilter(filter: SVGFilterElement, above = 30) {
  filter.setAttribute('x', '-30')
  filter.setAttribute('y', String(11.8 - above))
  filter.setAttribute('width', '305')
  filter.setAttribute('height', String(94 + above + 30))
}

/** Tween a number on animation frames, eased out. */
function tween(duration: number, onFrame: (t: number) => void, delay = 0) {
  let frame = 0
  const start = performance.now() + delay
  const step = (now: number) => {
    const t = Math.min(1, Math.max(0, (now - start) / duration))
    onFrame(1 - Math.pow(1 - t, 3))
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
  return () => cancelAnimationFrame(frame)
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v))
  return node
}

/* ---- Load ---- */

export type LoadId = 'bounce' | 'rise' | 'halftone' | 'grain' | 'typeon' | 'none'

export const LOADS: { id: LoadId; name: string; note: string }[] = [
  { id: 'bounce', name: 'Bounce', note: 'm, a and L drop in one after another, squash on landing and settle; the name hops in after.' },
  { id: 'rise', name: 'Rise', note: 'The letters spring up from the baseline, cut off by the noise filter’s own edge, so they seem to come up out of the floor.' },
  { id: 'halftone', name: 'Halftone', note: 'Each letter appears as LED dots that swell until they merge into the solid shape (the Doto dot-matrix idea); the name flickers on like a display.' },
  { id: 'grain', name: 'Grain', note: 'The mark condenses out of noise, speck by speck, in the same grain the logo is printed with.' },
  { id: 'typeon', name: 'Type-on', note: 'The dotted name types itself out first, then the monogram pops in over it, the a spinning into its tilt.' },
  { id: 'none', name: 'None', note: 'No load animation: the mark as exported, to judge the hovers on their own.' },
]

const BOUNCE: Keyframe[] = [
  { transform: 'translateY(-170%) scale(0.92, 1.14)', opacity: 0, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)' },
  { opacity: 1, offset: 0.12 },
  { transform: 'translateY(0) scale(1.2, 0.76)', offset: 0.44, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
  { transform: 'translateY(-16%) scale(0.95, 1.07)', offset: 0.64, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)' },
  { transform: 'translateY(0) scale(1.07, 0.94)', offset: 0.8 },
  { transform: 'translateY(0) scale(1, 1)' },
]

/** Runs a load animation and returns how to stop it. Resolves the mark to rest at the end. */
export function playLoad(id: LoadId, p: Parts): () => void {
  const stops: (() => void)[] = []
  const anims: Animation[] = []
  const animate = (node: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
    anims.push(node.animate(frames, { fill: 'backwards', ...options }))
  }

  // Room above for letters that drop in; a little all round for the rest.
  if (id !== 'rise') widenFilter(p.filter, id === 'bounce' ? 180 : 40)

  if (id === 'bounce') {
    p.letters.forEach((letter, i) => animate(letter, BOUNCE, { duration: 950, delay: 120 + i * 140 }))
    p.name.forEach((letter, i) =>
      animate(letter, [{ transform: 'translateY(-160%)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
        duration: 420,
        delay: 760 + i * 35,
        easing: 'cubic-bezier(0.3, 1.8, 0.5, 1)',
      }),
    )
  }

  if (id === 'rise') {
    // Kept inside the export's own filter box, which crops them at the baseline.
    p.letters.forEach((letter, i) =>
      animate(letter, [{ transform: 'translateY(115%)' }, { transform: 'none' }], {
        duration: 900,
        delay: 100 + i * 110,
        easing: 'cubic-bezier(0.2, 1.35, 0.35, 1)',
      }),
    )
    p.name.forEach((letter, i) =>
      animate(letter, [{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 500, delay: 650 + i * 30 }),
    )
    const t = window.setTimeout(() => widenFilter(p.filter), 1600)
    stops.push(() => clearTimeout(t))
  }

  if (id === 'halftone') {
    // One dot screen per letter, so each can resolve on its own beat.
    const defs = p.svg.querySelector('defs')!
    const pitch = 4.5
    const added: Element[] = []
    p.letters.forEach((letter, i) => {
      const dot = el('circle', { cx: pitch / 2, cy: pitch / 2, r: 0, fill: 'white' })
      const pattern = el('pattern', { id: `${p.ns}-dots-${i}`, width: pitch, height: pitch, patternUnits: 'userSpaceOnUse' })
      pattern.append(dot)
      const mask = el('mask', { id: `${p.ns}-halftone-${i}`, maskUnits: 'userSpaceOnUse', x: -150, y: -150, width: 550, height: 450 })
      mask.append(el('rect', { x: -150, y: -150, width: 550, height: 450, fill: `url(#${p.ns}-dots-${i})` }))
      defs.append(pattern, mask)
      added.push(pattern, mask)
      letter.setAttribute('mask', `url(#${p.ns}-halftone-${i})`)
      // Full cover once the radius passes half the diagonal of a cell.
      stops.push(
        tween(1000, (t) => {
          dot.setAttribute('r', String(t * pitch * 0.75))
          if (t === 1) letter.removeAttribute('mask')
        }, 150 + i * 220),
      )
    })
    stops.push(() => added.forEach((node) => node.remove()))
    p.name.forEach((letter, i) =>
      animate(letter, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.15, offset: 0.5 }, { opacity: 1 }], {
        duration: 360,
        delay: 500 + i * 55,
        easing: 'steps(4)',
      }),
    )
  }

  if (id === 'grain') {
    const defs = p.svg.querySelector('defs')!
    const funcA = el('feFuncA', { type: 'discrete', tableValues: '0' })
    const filter = el('filter', { id: `${p.ns}-dissolve`, x: -150, y: -150, width: 550, height: 450, filterUnits: 'userSpaceOnUse' })
    // Noise, thresholded to specks, painted white: a mask that fills in as the threshold rises.
    const transfer = el('feComponentTransfer', { in: 'alpha', result: 'specks' })
    transfer.append(funcA)
    filter.append(
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: 1.4, numOctaves: 2, seed: 11, result: 'noise' }),
      el('feColorMatrix', { in: 'noise', type: 'luminanceToAlpha', result: 'alpha' }),
      transfer,
      el('feFlood', { 'flood-color': 'white', result: 'white' }),
      el('feComposite', { in: 'white', in2: 'specks', operator: 'in' }),
    )
    const mask = el('mask', { id: `${p.ns}-grain`, maskUnits: 'userSpaceOnUse', x: -150, y: -150, width: 550, height: 450 })
    mask.append(el('rect', { x: -150, y: -150, width: 550, height: 450, fill: 'white', filter: `url(#${p.ns}-dissolve)` }))
    defs.append(filter, mask)
    p.root.setAttribute('mask', `url(#${p.ns}-grain)`)
    stops.push(
      tween(1500, (t) => {
        // The noise bunches around mid-grey: from 12 to 28 of 40 levels the
        // mark goes from a few specks to nearly solid, so sweep just that band.
        const n = t === 1 ? 40 : Math.round(12 + t * 16)
        funcA.setAttribute('tableValues', `${'1 '.repeat(n)}${'0 '.repeat(40 - n)}`.trim())
        if (t === 1) p.root.removeAttribute('mask')
      }, 100),
    )
    stops.push(() => {
      filter.remove()
      mask.remove()
    })
  }

  if (id === 'typeon') {
    p.name.forEach((letter, i) => animate(letter, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: 150 + i * 60 }))
    const after = 150 + p.name.length * 60 + 100
    p.letters.forEach((letter, i) =>
      animate(
        letter,
        [
          { transformOrigin: '50% 50%', transform: i === 1 ? 'scale(0) rotate(-200deg)' : 'scale(0)' },
          { transformOrigin: '50% 50%', transform: i === 1 ? 'scale(1.12) rotate(12deg)' : 'scale(1.12)', offset: 0.7 },
          { transformOrigin: '50% 50%', transform: 'none' },
        ],
        { duration: 620, delay: after + i * 110, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' },
      ),
    )
  }

  return () => {
    anims.forEach((a) => a.cancel())
    stops.forEach((stop) => stop())
  }
}

/* ---- Hover ---- */

export type HoverId = 'spotlight' | 'sweep' | 'boil' | 'ink' | 'shift' | 'jelly'

export const HOVERS: { id: HoverId; name: string; note: string }[] = [
  { id: 'spotlight', name: 'Spotlight', note: 'a soft white light sits right on the cursor, clipped to the letters and grained by the same noise' },
  { id: 'sweep', name: 'Sweep', note: 'the gradients turn round their letters, a slow glint, and wind back when you leave' },
  { id: 'boil', name: 'Boil', note: 'the noise reseeds about twelve times a second, so the grain crawls like film' },
  { id: 'ink', name: 'Ink', note: 'the noise threshold rises until the stipple floods the letters with ink, and drains when you leave' },
  { id: 'shift', name: 'Shift', note: 'the ink cycles blue, green, pink, each colour travelling across m, a, L and into the name, and finishes the lap on its own colour when you leave' },
  { id: 'jelly', name: 'Jelly', note: 'each letter wobbles when the pointer crosses it' },
]

const JELLY: Keyframe[][] = [
  // m squashes, a spins back into its tilt, L kicks.
  [{ transform: 'none' }, { transform: 'scale(1.14, 0.84)' }, { transform: 'scale(0.94, 1.08)' }, { transform: 'scale(1.03, 0.98)' }, { transform: 'none' }],
  [{ transform: 'none' }, { transform: 'rotate(-28deg) translateY(-8%)', transformOrigin: '50% 50%' }, { transform: 'rotate(10deg)', transformOrigin: '50% 50%' }, { transform: 'none', transformOrigin: '50% 50%' }],
  [{ transform: 'none', transformOrigin: '0% 100%' }, { transform: 'skewX(-14deg)', transformOrigin: '0% 100%' }, { transform: 'skewX(6deg)', transformOrigin: '0% 100%' }, { transform: 'none', transformOrigin: '0% 100%' }],
]

/*
 * The three colourways as exported, for Shift: the letters' brand stop, the
 * noise ink (blue's is 60% opaque) and the dotted name.
 */
const BRAND = ['#0059FF', '#81DB89', '#F551AB']
const INK = ['rgba(0, 89, 255, 0.6)', '#81DB89', '#F551AB']
const NAME = ['#8FC0E8', '#81DB89', '#F551AB']

/** Colour `phase` steps along a palette from colourway `home`, blended in OKLCH. */
function along(palette: string[], home: number, phase: number) {
  const at = home + phase
  const from = palette[Math.floor(at) % 3]
  const to = palette[(Math.floor(at) + 1) % 3]
  const t = at - Math.floor(at)
  return t < 0.001 ? from : `color-mix(in oklch, ${to} ${(t * 100).toFixed(1)}%, ${from})`
}

/**
 * Wires the chosen hovers to the mark. One frame loop eases the gradient and
 * grain values toward where they should be and stops once they're there.
 */
export function bindHovers(host: HTMLElement, p: Parts, active: HoverId[], still: boolean): () => void {
  const on = new Set(active)
  // Sweep turns each gradient about the middle of its axis.
  const centres = p.gradients.map((g) => ({
    x: (Number(g.getAttribute('x1')) + Number(g.getAttribute('x2'))) / 2,
    y: (Number(g.getAttribute('y1')) + Number(g.getAttribute('y2'))) / 2,
  }))
  const seed = p.turbulence.getAttribute('seed') ?? '0'
  const rest = 0.51
  const s = { hovered: false, angle: 0, spin: 0, grain: rest, hue: 0, hueSpeed: 0, lap: Infinity }
  // Shift: which colourway this file is, and how far behind m each part changes.
  const home = Math.max(0, BRAND.indexOf(p.gradients[0].querySelector('stop')!.getAttribute('stop-color')!.toUpperCase()))
  const brandStops = p.gradients.map((g) => g.querySelector('stop')!)
  const gradientLag = [0, 0.3, 0.15] // the export's order: m, L, a
  const nameLag = (i: number) => 0.4 + i * 0.03
  const lastLag = nameLag(p.name.length - 1)
  const clearShift = () => {
    brandStops.forEach((stop) => stop.style.removeProperty('stop-color'))
    p.ink.style.removeProperty('flood-color')
    p.name.forEach((letter) => letter.style.removeProperty('fill'))
  }
  let frame = 0
  let last = 0
  let boil = 0

  // Spotlight: a radial light over the letters, clipped to copies of their
  // outlines and placed inside the noise group so the grain prints over it.
  // It's moved straight from pointer events, so it sits on the cursor.
  const spot = on.has('spotlight') ? addSpotlight(p) : null

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    let busy = false

    if (on.has('sweep')) {
      s.spin += ((s.hovered ? 140 : 0) - s.spin) * 0.08
      s.angle += s.spin * dt
      if (!s.hovered) {
        // Wind forward to the next full turn rather than snapping back.
        const home = Math.ceil(s.angle / 360 - 0.001) * 360
        s.angle += (home - s.angle) * 0.06
        if (Math.abs(home - s.angle) < 0.2) s.angle = 0
        else busy = true
      } else busy = true
    }
    if (on.has('shift')) {
      // A lap is three colours. Leaving finishes the lap: m stops at home
      // (the cap) while the parts behind it catch up, then it all clears.
      s.hueSpeed += ((s.hovered ? 0.55 : 0) - s.hueSpeed) * 0.06
      if (s.hovered) {
        s.lap = Infinity
        s.hue += s.hueSpeed * dt
        busy = true
      } else if (s.hue > 0) {
        if (s.lap === Infinity) s.lap = Math.ceil(s.hue / 3 - 0.001) * 3
        const end = s.lap + lastLag
        s.hue += Math.max(s.hueSpeed * dt, (end - s.hue) * 0.05)
        busy = true
        if (s.hue >= end - 0.005) {
          s.hue = 0
          s.lap = Infinity
          clearShift()
        }
      }
      if (s.hue > 0) {
        const part = (lag: number) => Math.min(Math.max(0, s.hue - lag), s.lap)
        brandStops.forEach((stop, i) => stop.style.setProperty('stop-color', along(BRAND, home, part(gradientLag[i]))))
        p.ink.style.setProperty('flood-color', along(INK, home, part(0.15)))
        p.name.forEach((letter, i) => letter.style.setProperty('fill', along(NAME, home, part(nameLag(i)))))
      }
    }
    if (on.has('ink')) {
      // Stops short of full, which would flatten the gradient to one tone.
      const target = s.hovered ? 0.8 : rest
      s.grain += (target - s.grain) * 0.1
      if (Math.abs(target - s.grain) > 0.004) busy = true
      else s.grain = target
      setGrain(p.grain, s.grain)
    }

    if (on.has('sweep')) {
      p.gradients.forEach((g, i) => {
        if (s.angle) g.setAttribute('gradientTransform', `rotate(${s.angle} ${centres[i].x} ${centres[i].y})`)
        else g.removeAttribute('gradientTransform')
      })
    }

    frame = busy ? requestAnimationFrame(tick) : 0
  }

  const kick = () => {
    if (frame) return
    last = performance.now()
    frame = requestAnimationFrame(tick)
  }

  const aim = (event: PointerEvent) => {
    const m = spot && p.svg.getScreenCTM()
    if (!spot || !m) return
    const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse())
    spot.light.setAttribute('cx', String(pt.x))
    spot.light.setAttribute('cy', String(pt.y))
  }

  const onEnter = (event: PointerEvent) => {
    s.hovered = true
    aim(event)
    spot?.glow.style.setProperty('opacity', '1')
    kick()
    if (on.has('boil') && !still) {
      boil = window.setInterval(() => p.turbulence.setAttribute('seed', String(Math.floor(Math.random() * 999))), 85)
    }
  }
  const onMove = (event: PointerEvent) => aim(event)
  const onLeave = () => {
    s.hovered = false
    spot?.glow.style.setProperty('opacity', '0')
    kick()
    clearInterval(boil)
    p.turbulence.setAttribute('seed', seed)
  }

  const wobbles: Animation[] = []
  const jelly = p.letters.map((letter, i) => {
    const handler = () => {
      if (still || wobbles[i]?.playState === 'running') return
      wobbles[i] = letter.animate(JELLY[i], { duration: 620, easing: 'ease-out' })
      // The spotlight's copy of the outline wobbles with it, so the light stays inside.
      spot?.outlines[i].animate(JELLY[i], { duration: 620, easing: 'ease-out' })
    }
    if (on.has('jelly')) letter.addEventListener('pointerenter', handler)
    return handler
  })

  host.addEventListener('pointerenter', onEnter)
  host.addEventListener('pointermove', onMove)
  host.addEventListener('pointerleave', onLeave)

  return () => {
    host.removeEventListener('pointerenter', onEnter)
    host.removeEventListener('pointermove', onMove)
    host.removeEventListener('pointerleave', onLeave)
    p.letters.forEach((letter, i) => letter.removeEventListener('pointerenter', jelly[i]))
    cancelAnimationFrame(frame)
    clearInterval(boil)
    p.turbulence.setAttribute('seed', seed)
    setGrain(p.grain, rest)
    clearShift()
    spot?.remove()
    p.gradients.forEach((g) => g.removeAttribute('gradientTransform'))
  }
}

/**
 * Builds the spotlight: a white radial gradient on a rect over the letters,
 * clipped to copies of the m, a and L outlines. Starts transparent.
 */
function addSpotlight(p: Parts) {
  const defs = p.svg.querySelector('defs')!
  const light = el('radialGradient', { id: `${p.ns}-spot`, gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: 44 })
  light.append(
    el('stop', { 'stop-color': 'white', 'stop-opacity': 0.95 }),
    el('stop', { offset: 0.4, 'stop-color': 'white', 'stop-opacity': 0.5 }),
    el('stop', { offset: 1, 'stop-color': 'white', 'stop-opacity': 0 }),
  )
  const clip = el('clipPath', { id: `${p.ns}-spot-clip` })
  const outlines = p.letters.map((letter) => {
    const copy = letter.cloneNode() as SVGPathElement
    copy.removeAttribute('id')
    copy.removeAttribute('fill')
    clip.append(copy)
    return copy
  })
  defs.append(light, clip)
  const glow = el('rect', { x: -30, y: 0, width: 305, height: 120, fill: `url(#${p.ns}-spot)`, 'clip-path': `url(#${p.ns}-spot-clip)`, class: 'mal-spot' })
  p.group.append(glow)
  return {
    light,
    glow,
    outlines,
    remove: () => [light, clip, glow].forEach((node) => node.remove()),
  }
}
