import { CrabPaths } from '@/components/brand/pixel-crab'

import { Shadow, Sheet } from './bake'

/**
 * Luggage as pixel art, on the same cells as the footer's brand grid. Each bag
 * is a map of rows, one character per cell:
 *   B blue · P pink · G green · K ink · C cream · S sky · . empty
 * Drawn at 8px a cell, so they sit on the belt's 32px slats.
 */

export const PX = 8

const COLORS: Record<string, string> = {
  B: '#0059ff',
  P: '#f551ab',
  G: '#81db89',
  K: '#0a0f1f',
  C: '#fbefe2',
  S: '#8dcbf2',
}

export type PixelKind = 'suitcase' | 'duffel' | 'hatbox' | 'trunk' | 'backpack' | 'crab'

const ART: Record<Exclude<PixelKind, 'crab'>, string[]> = {
  suitcase: [
    '....BBBB....',
    '....B..B....',
    'CCCCCCCCCCCC',
    'CBCCCBCCCBCC',
    'CBCCCBCCCBCC',
    'BBBBBBBBBBBB',
    'CBCCCBCCCBCC',
    'CBCCCBCCCBCC',
    'CBCCCBCCCBCC',
    'BBBBBBBBBBBB',
    'CBCCCBCCCBCC',
    'CBCCCBCCCBCC',
    'CBCCCBCCCBCC',
    'CCCCCCCCCCCC',
    '.KK......KK.',
  ],
  duffel: [
    '........BBBBBB........',
    '.......B......B.......',
    '..GGGGGGGGGGGGGGGGGG..',
    '.GGCCGGGGGCCGGGGGCCGG.',
    'GGGCCGGGGGCCGGGGGCCGGG',
    'GGGGGGGGGGGGGGGGGGGGGG',
    'GGGGGGCCGGGGGCCGGGGGGG',
    '.GGGGGCCGGGGGCCGGGGGG.',
    '..GGGGGGGGGGGGGGGGGG..',
  ],
  hatbox: [
    '....PPPP....',
    '..PPPPPPPP..',
    '.PPPBBBBPPP.',
    '.PPBPPPPBPP.',
    'PPBPPCCPPBPP',
    'PPBPCPPCPBPP',
    'PPBPCPPCPBPP',
    'PPBPPCCPPBPP',
    '.PPBPPPPBPP.',
    '.PPPBBBBPPP.',
    '..PPPPPPPP..',
    '....PPPP....',
  ],
  // The brand grid unit (B . P . . G B . / . B . P G . . B) on cream, in an ink frame.
  trunk: [
    '......KKKK......',
    'KKKKKKKKKKKKKKKK',
    'KBCPCCGBCBCPCCGK',
    'KCBCPGCCBCBCPGCK',
    'KBCPCCGBCBCPCCGK',
    'KKKKKKKKKKKKKKKK',
    'KCBCPGCCBCBCPGCK',
    'KBCPCCGBCBCPCCGK',
    'KCBCPGCCBCBCPGCK',
    'KBCPCCGBCBCPCCGK',
    'KKKKKKKKKKKKKKKK',
  ],
  backpack: [
    '....KKKK....',
    '...K....K...',
    '.BBBBBBBBBB.',
    'BSSSSSSSSSSB',
    'BSSSSSSSSSSB',
    'BBBBBBBBBBBB',
    'KBBBBBBBBBBK',
    'KBBPPPPPPBBK',
    'KBBPCPCPPBBK',
    'KBBPPPPPPBBK',
    'KBBPPPPPPBBK',
    'KBBBBBBBBBBK',
    '.BBBBBBBBBB.',
  ],
}

const CRAB: [number, number] = [22 * 4, 16 * 4]

export function pixelSize(kind: PixelKind): [number, number] {
  if (kind === 'crab') return CRAB
  const rows = ART[kind]
  return [Math.max(...rows.map((row) => row.length)) * PX, rows.length * PX]
}

/** The bag as a standalone document, in cells, with a hard shadow one cell down and across. */
export function PixelDocument({ kind }: { kind: PixelKind }) {
  const [w, h] = pixelSize(kind)
  // The crab is 22×16 at 4px a pixel; the bags are drawn at 8px a cell.
  const unit = kind === 'crab' ? 4 : PX
  return (
    <Sheet w={w} h={h} unit={unit} shapeRendering="crispEdges">
      <defs>
        <Shadow dx={PX / unit} dy={PX / unit} opacity={0.35} />
      </defs>
      <g filter="url(#shadow)">
        {kind === 'crab' ? (
          <CrabPaths />
        ) : (
          ART[kind].flatMap((row, y) => runs(row).map(([x, len, c]) => <rect key={`${x}-${y}`} x={x} y={y} width={len} height="1" fill={COLORS[c]} />))
        )}
      </g>
    </Sheet>
  )
}

/** Merges each row into same-colour runs, so a bag is a few dozen rects rather than a few hundred. */
function runs(row: string) {
  const out: Array<[number, number, string]> = []
  for (let x = 0; x < row.length; x++) {
    const c = row[x]
    if (!COLORS[c]) continue
    const last = out.at(-1)
    if (last && last[2] === c && last[0] + last[1] === x) last[1]++
    else out.push([x, 1, c])
  }
  return out
}
