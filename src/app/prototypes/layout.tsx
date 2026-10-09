import type { Metadata } from 'next'

import './_flight/flight.css'

export const metadata: Metadata = {
  title: { default: 'Prototypes', template: '%s — Prototypes' },
  robots: { index: false, follow: false },
}

/** Layout experiments. Not linked from the site and kept out of search. */
export default function PrototypesLayout({ children }: { children: React.ReactNode }) {
  return children
}
