import { Shadow, Sheet } from './bake'

/**
 * Luggage seen from above, drawn for the baggage claim belt. Every bag is a
 * flat shape in the brand colours with a pattern clipped inside it, a shade
 * and riso grain laid over the top, and a hard shadow. Sizes are in belt
 * pixels at the 232px design height. Bags are baked to images (see bake.tsx).
 */

const C = {
  blue: '#0059ff',
  pink: '#f551ab',
  green: '#81db89',
  sky: '#8dcbf2',
  cream: '#fbefe2',
  ink: '#0a0f1f',
}

export type BagKind = 'grid' | 'duffel' | 'hatbox' | 'shell' | 'roll' | 'dome' | 'trunk' | 'backpack'

/** A body shape, its pattern clipped inside, and the shade on top. */
function Body({ id, shape, fill, children }: { id: string; shape: React.ReactElement; fill: string; children?: React.ReactNode }) {
  return (
    <>
      <clipPath id={id}>{shape}</clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="100%" height="100%" fill={fill} />
        {children}
        <rect width="100%" height="100%" fill="url(#bag-shade)" />
      </g>
    </>
  )
}

/** Deterministic scatter, so the sprinkles land in the same places on the server and the client. */
function scatter(count: number, w: number, h: number, seed: number) {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: count }, () => ({ x: rand() * w, y: rand() * h, r: rand() * 180 }))
}

export const bagSize: Record<BagKind, [number, number]> = {
  grid: [120, 158],
  duffel: [192, 88],
  hatbox: [124, 124],
  shell: [172, 126],
  roll: [100, 160],
  dome: [154, 104],
  trunk: [180, 124],
  backpack: [128, 146],
}

/** The bag as a standalone document: painted shapes, then riso grain, then a hard shadow. */
export function BagDocument({ kind }: { kind: BagKind }) {
  const [w, h] = bagSize[kind]
  return (
    <Sheet w={w} h={h}>
      <defs>
        <linearGradient id="bag-shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.35" stopColor={C.ink} stopOpacity="0" />
          <stop offset="1" stopColor={C.ink} stopOpacity="0.22" />
        </linearGradient>
        <filter id="bag-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.3" result="specks" />
          <feComposite in="specks" in2="SourceGraphic" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
        <Shadow dx={5} dy={7} opacity={0.3} />
      </defs>
      <g filter="url(#shadow)">
        <g filter="url(#bag-grain)">{drawings[kind](`body-${kind}`)}</g>
      </g>
    </Sheet>
  )
}

const drawings: Record<BagKind, (id: string) => React.ReactNode> = {
  /* Cream hard case with a blue windowpane check, carry handle up top, wheels below. */
  grid: (id) => (
    <>
      <rect x="44" y="2" width="32" height="16" rx="5" fill="none" stroke={C.blue} strokeWidth="6" />
      <circle cx="24" cy="150" r="7" fill={C.ink} />
      <circle cx="96" cy="150" r="7" fill={C.ink} />
      <Body id={id} fill={C.cream} shape={<rect x="6" y="14" width="108" height="134" rx="12" />}>
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`v${i}`} x1={12 + i * 17} y1="0" x2={12 + i * 17} y2="160" stroke={C.blue} strokeWidth="3.5" />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={22 + i * 17} x2="120" y2={22 + i * 17} stroke={C.blue} strokeWidth="3.5" />
        ))}
      </Body>
    </>
  ),

  /* Green holdall with cream polka dots and two blue grab handles. */
  duffel: (id) => (
    <>
      <Body id={id} fill={C.green} shape={<rect x="4" y="12" width="184" height="72" rx="36" />}>
        {[0, 1, 2, 3, 4, 5].flatMap((col) =>
          [0, 1].map((row) => (
            <circle key={`${col}-${row}`} cx={22 + col * 31 + (row ? 15 : 0)} cy={row ? 66 : 28} r="7" fill={C.cream} />
          )),
        )}
        <line x1="10" y1="48" x2="182" y2="48" stroke={C.ink} strokeOpacity="0.3" strokeWidth="3" />
      </Body>
      <path d="M72 40 C 76 4, 116 4, 120 40" fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" />
      <path d="M80 40 C 84 14, 108 14, 112 40" fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" />
    </>
  ),

  /* Pink hatbox with cream contour rings, like the grain of a log. */
  hatbox: (id) => (
    <Body id={id} fill={C.pink} shape={<circle cx="62" cy="62" r="58" />}>
      {[54, 44, 34, 24, 14].map((r, i) => (
        <ellipse
          key={r}
          cx={52 + i * 2}
          cy={56 + i * 1.5}
          rx={r * 1.15}
          ry={r * 0.92}
          fill="none"
          stroke={i % 2 ? C.blue : C.cream}
          strokeWidth="4"
          transform={`rotate(${-18 + i * 6} 62 62)`}
        />
      ))}
    </Body>
  ),

  /* Blue hard shell with pink wood-grain contours and a green side handle. */
  shell: (id) => (
    <>
      <rect x="0" y="42" width="14" height="42" rx="5" fill={C.green} />
      <circle cx="160" cy="12" r="6" fill={C.ink} />
      <circle cx="160" cy="114" r="6" fill={C.ink} />
      <Body id={id} fill={C.blue} shape={<rect x="10" y="6" width="152" height="114" rx="14" />}>
        {[78, 64, 50, 37, 25, 14].map((r) => (
          <path
            key={r}
            d={`M ${96 - r} 63 C ${96 - r} ${63 - r * 0.9}, ${96 + r} ${63 - r * 0.7}, ${96 + r} 63 S ${96 - r * 0.8} ${63 + r * 0.95}, ${96 - r} 63`}
            fill="none"
            stroke={C.pink}
            strokeWidth="4"
          />
        ))}
      </Body>
    </>
  ),

  /* Cream bedroll strewn with sprinkles, cinched by a blue strap. */
  roll: (id) => (
    <Body id={id} fill={C.cream} shape={<rect x="8" y="6" width="84" height="148" rx="42" />}>
      {scatter(34, 100, 160, 7).map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width="9"
          height="3"
          rx="1.5"
          fill={i % 3 ? C.green : C.pink}
          transform={`rotate(${p.r} ${p.x + 4.5} ${p.y + 1.5})`}
        />
      ))}
      <line x1="50" y1="0" x2="50" y2="160" stroke={C.pink} strokeWidth="3" />
      <rect x="0" y="70" width="100" height="14" fill={C.blue} />
      <rect x="42" y="64" width="16" height="26" rx="3" fill={C.ink} />
    </Body>
  ),

  /* Green dome bag with blue rings, pink dashes and a cream loop handle. */
  dome: (id) => (
    <>
      <path d="M96 30 C 104 0, 140 4, 132 36" fill="none" stroke={C.cream} strokeWidth="6" strokeLinecap="round" />
      <Body id={id} fill={C.green} shape={<path d="M4 100 A 73 73 0 0 1 150 100 Z" />}>
        {[
          [44, 56],
          [86, 40],
          [112, 76],
          [64, 86],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="12" fill="none" stroke={C.blue} strokeWidth="4" />
        ))}
        {[
          [24, 80],
          [32, 80],
          [118, 52],
          [126, 52],
          [90, 92],
          [98, 92],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="3.5" height="12" fill={C.pink} />
        ))}
      </Body>
    </>
  ),

  /* A steamer trunk in the footer's own pixel grid: B . P . . G B . / . B . P G . . B */
  trunk: (id) => {
    const unit = ['B.P..GB.', '.B.PG..B']
    const fills: Record<string, string> = { B: C.blue, P: C.pink, G: C.green }
    return (
      <>
        <rect x="70" y="0" width="40" height="12" rx="4" fill={C.ink} />
        <Body id={id} fill={C.cream} shape={<rect x="4" y="8" width="172" height="112" rx="10" />}>
          {Array.from({ length: 8 }, (_, row) =>
            unit[row % 2].split('').map((cell, col) =>
              fills[cell] ? (
                <rect key={`${row}-${col}`} x={4 + col * 21.5} y={8 + row * 14} width="21.5" height="14" fill={fills[cell]} />
              ) : null,
            ),
          )}
          <rect x="4" y="60" width="172" height="8" fill={C.ink} opacity="0.85" />
        </Body>
        {[
          [4, 8],
          [164, 8],
          [4, 108],
          [164, 108],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" rx="3" fill={C.ink} />
        ))}
      </>
    )
  },

  /* Blue backpack with a pink front pocket and ink straps. */
  backpack: (id) => (
    <>
      <path d="M50 18 C 50 2, 78 2, 78 18" fill="none" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
      <Body id={id} fill={C.blue} shape={<rect x="12" y="14" width="104" height="128" rx="30" />}>
        <rect x="12" y="14" width="104" height="34" fill={C.sky} />
        <path d="M12 48 Q 64 66 116 48" fill="none" stroke={C.ink} strokeOpacity="0.4" strokeWidth="3" />
        <rect x="30" y="78" width="68" height="50" rx="14" fill={C.pink} />
        <line x1="40" y1="92" x2="88" y2="92" stroke={C.cream} strokeWidth="3" strokeDasharray="4 4" />
      </Body>
      <rect x="0" y="40" width="14" height="70" rx="6" fill={C.ink} />
      <rect x="114" y="40" width="14" height="70" rx="6" fill={C.ink} />
    </>
  ),
}
