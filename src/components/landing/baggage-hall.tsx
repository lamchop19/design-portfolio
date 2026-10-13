'use client'

import { Pause, Play } from 'lucide-react'
import { useState } from 'react'

import { BaggageBelt } from '@/app/prototypes/_baggage/baggage-claim'
import type { WorkItem } from '@/lib/work-items'

export function BaggageHall({ items }: { items: WorkItem[] }) {
  const [paused, setPaused] = useState(false)

  return (
    <div className="terminal-hall">
      <div className="terminal-wall" aria-hidden="true" />

      <div className="terminal-conveyor">
        <BaggageBelt items={items} style="riso" view="front" tags="hover" speed={paused ? 0 : 0.65} />
      </div>

      <div className="terminal-floor">
        <span className="terminal-floor-label" aria-hidden="true">NYC / Baggage claim</span>
        <button
          type="button"
          className="terminal-motion"
          aria-label={paused ? 'Resume luggage animation' : 'Pause luggage animation'}
          title={paused ? 'Resume luggage animation' : 'Pause luggage animation'}
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

