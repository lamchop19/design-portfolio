import { GridOverlay } from '@/components/layout/grid-overlay'
import type { WorkItem } from '@/lib/work-items'

import { PassportTile } from './passport-tile'
import { BeltTile, BentoBar, ContactTile, WordmarkTile } from './tiles'
import { WorksColumn } from './works'

import '../_flight/signs.css'
import '../_baggage/baggage.css'
import '@/components/landing/baggage-hall.css'
import './bento.css'

/**
 * A. Split terminal. Who Marc is stays pinned on the left (the wordmark, the
 * belt, the passport and the ways in touch) while the work scrolls past on
 * the right. Below 1024px it stacks: wordmark, belt, work, passport, contact.
 */
export function SplitTerminal({ items }: { items: WorkItem[] }) {
  return (
    <div className="bento bento-split">
      <BentoBar current="A" />
      <div className="bento-split-grid">
        <div className="bento-split-left">
          <WordmarkTile className="split-wordmark" />
          <BeltTile items={items} className="split-belt" />
          <PassportTile className="split-passport" />
          <ContactTile className="split-contact" />
        </div>
        <div className="bento-split-right">
          <WorksColumn items={items} />
        </div>
      </div>
      <GridOverlay />
    </div>
  )
}
