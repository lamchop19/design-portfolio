import type { Metadata } from 'next'

import { OceanWallpaper } from '@/components/ocean/ocean-wallpaper'

export const metadata: Metadata = {
  title: { default: 'Prototypes', template: '%s — Prototypes' },
  robots: { index: false, follow: false },
}

/**
 * Layout experiments. Not linked from the site and kept out of search. They
 * keep the ocean wallpaper they were made over; the site itself now sits on a
 * painted scene (components/scenes).
 */
export default function PrototypesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OceanWallpaper />
      {children}
    </>
  )
}
