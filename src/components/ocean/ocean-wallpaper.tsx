import { asset } from '@/lib/paths'

import './ocean.css'

/**
 * The page's wallpaper: engraved swell lines printed in faint riso ink behind
 * everything, denser towards the bottom (ocean.css). Server-rendered, no JS.
 *
 * `water` swaps the swell lines for another treatment (see /prototypes/ocean).
 */
export function OceanWallpaper({ water }: { water?: React.ReactNode }) {
  return (
    <div className="ocean" aria-hidden="true">
      {water ?? <div className="ocean-water" style={{ '--tile': `url(${asset('/specimens/water-waves.png')})` } as React.CSSProperties} />}
    </div>
  )
}
