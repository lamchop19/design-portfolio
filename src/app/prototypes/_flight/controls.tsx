'use client'

import Link from 'next/link'
import { useState } from 'react'

import { densities, flips, speeds, updateSettings, useSettings } from './settings'

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<[T, string]>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-ink-faint">{label}</span>
      <span className="flex flex-wrap gap-1">
        {options.map(([option, text]) => (
          <button
            key={String(option)}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className="px-2 py-0.5 text-ink-muted transition-colors hover:text-accent aria-pressed:bg-ink aria-pressed:text-surface"
          >
            {text}
          </button>
        ))}
      </span>
    </div>
  )
}

/**
 * A tab on the left edge that opens the prototype switches. Not part of the
 * design. `chrome={false}` leaves out the strip density, for layouts with their own.
 */
export function PrototypeControls({
  onReplay,
  chrome = true,
  replayLabel = 'Replay wordmark',
}: {
  onReplay: () => void
  chrome?: boolean
  replayLabel?: string
}) {
  const settings = useSettings()
  const [open, setOpen] = useState(false)

  return (
    <aside className="proto-controls leg-paper t-label" data-open={open || undefined}>
      <button type="button" className="proto-controls-tab" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Close ×' : 'Prototype'}
      </button>
      {open ? (
        <div className="proto-controls-panel">
          {chrome ? (
            <Segmented label="Chrome" options={densities} value={settings.ui} onChange={(ui) => updateSettings({ ui })} />
          ) : null}
          <Segmented label="Wordmark flip" options={flips} value={settings.flip} onChange={(flip) => updateSettings({ flip })} />
          <Segmented
            label="Flip duration"
            options={speeds.map((s): [number, string] => [s, `${s}×`])}
            value={settings.speed}
            onChange={(speed) => updateSettings({ speed })}
          />
          <div className="flex justify-between gap-4 border-t border-rule pt-3">
            <button
              type="button"
              className="transition-colors hover:text-accent"
              onClick={() => {
                updateSettings({ replay: settings.replay + 1 })
                onReplay()
              }}
            >
              {replayLabel} ↺
            </button>
            <Link href="/prototypes/flip" className="transition-colors hover:text-accent">
              Flip lab →
            </Link>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
