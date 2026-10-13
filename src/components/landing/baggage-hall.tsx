'use client'

import { Pause, Play } from 'lucide-react'
import { useState } from 'react'

import { BaggageBelt } from '@/app/prototypes/_baggage/baggage-claim'
import { baked, BakedImg, Shadow, Sheet } from '@/app/prototypes/_baggage/bake'
import type { WorkItem } from '@/lib/work-items'

export function BaggageHall({ items }: { items: WorkItem[] }) {
  const [paused, setPaused] = useState(false)

  return (
    <div className="terminal-hall">
      <div className="terminal-wall" aria-hidden="true">
        <div className="terminal-planter">
          <BakedImg src={baked('terminal-planter', () => <Planter />)} size={[160, 280]} />
        </div>
      </div>

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

function Planter() {
  return (
    <Sheet w={160} h={280}>
      <defs>
        <Shadow dx={4} dy={5} opacity={0.12} />
        <pattern id="pot-check" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill="#dfb5d0" />
          <path d="M0 0h11v11H0zM11 11h11v11H11z" fill="#677dac" />
        </pattern>
        <filter id="plant-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 -0.5" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <g filter="url(#plant-grain)">
          <g fill="none" stroke="#487765" strokeWidth="4">
            <path d="M82 215Q69 113 89 27M80 175Q40 133 28 91M81 192Q125 145 132 96M80 120Q111 98 125 53" />
          </g>
          <g fill="#88b69a">
            <path d="M88 84C51 61 65 12 95 5C111 39 106 62 88 84Z" />
            <path d="M59 143C18 150 0 117 9 80C45 81 65 108 59 143Z" />
            <path d="M99 163C98 120 119 96 154 101C162 136 135 164 99 163Z" />
          </g>
          <g fill="#619682">
            <path d="M84 117C84 76 109 46 139 43C144 81 117 112 84 117Z" />
            <path d="M74 190C33 197 14 169 15 144C46 140 74 157 74 190Z" />
          </g>
          <g fill="none" stroke="#467763" strokeWidth="2">
            <path d="M88 79 94 22M57 138 19 94M103 158 142 113M90 109 130 55M68 184 26 154" />
          </g>
          <path d="M38 204H122L113 273H47Z" fill="url(#pot-check)" />
          <path d="M104 204H122L113 273H100Z" fill="#0a0f1f" opacity="0.12" />
          <rect x="34" y="201" width="92" height="12" rx="3" fill="#677dac" />
        </g>
      </g>
    </Sheet>
  )
}
