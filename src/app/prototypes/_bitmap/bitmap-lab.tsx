'use client'

import { useState } from 'react'

import { RuledIndex } from '@/components/home/ruled-index'
import type { WorkItem } from '@/lib/work-items'

import { BitmapCover, type BitmapMode } from './bitmap-cover'
import { PALETTES, PIXEL_SIZES, type PaletteId, type PixelSize } from './dither'

import '../_panel/panel.css'
import './bitmap.css'

const MODES: Array<{ id: BitmapMode; name: string; note: string }> = [
  { id: 'live', name: 'Live', note: 'Drawn on a canvas at the cell’s own size; each new specimen dissolves in through the dither.' },
  { id: 'print', name: 'Pre-rendered', note: 'The PNGs from npm run bitmaps (public/bitmap, 4:5 at 480 × 600): no script, no motion, cropped to fit on phones.' },
]

/**
 * The ruled-index homepage with each project's cover cell showing its bitmap
 * specimen: soft shapes in a few inks, printed as an ordered dither. Point at a
 * row to change the specimen. The panel picks the palette, the pixel size and
 * whether it's drawn live or shown pre-rendered.
 */
export function BitmapLab({ items }: { items: WorkItem[] }) {
  const [palette, setPalette] = useState<PaletteId>('dreams')
  const [pixel, setPixel] = useState<PixelSize>(3)
  const [mode, setMode] = useState<BitmapMode>('live')
  const [folded, setFolded] = useState(false)
  const notes = [PALETTES.find((p) => p.id === palette)!.note, MODES.find((m) => m.id === mode)!.note]

  return (
    <>
      <RuledIndex
        items={items}
        renderCover={(item, i) => <BitmapCover item={item} index={i} palette={palette} pixel={pixel} mode={mode} />}
      />

      <aside className="hl-panel hl-corner" aria-label="Bitmap options" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Palette">
          {PALETTES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === palette}
              className="hl-chip"
              onClick={() => setPalette(option.id)}
            >
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Bitmap' : 'Hide'}
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Pixel size">
          {PIXEL_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={size === pixel}
              className="hl-chip"
              onClick={() => setPixel(size)}
            >
              {size}px
            </button>
          ))}
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Rendering">
          {MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === mode}
              className="hl-chip"
              onClick={() => setMode(option.id)}
            >
              {option.name}
            </button>
          ))}
        </div>
        <p className="hl-note">{notes.join(' ')}</p>
      </aside>
    </>
  )
}
