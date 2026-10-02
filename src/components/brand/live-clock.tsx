'use client'

import { useSyncExternalStore } from 'react'

import { SplitFlap } from '@/components/split-flap/split-flap'
import { CLOCK_DRUM } from '@/lib/flap'

const format = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Wakes on each minute boundary, and when the tab comes back into view, since
// background tabs throttle timers.
function subscribe(onChange: () => void) {
  let timer = 0
  const schedule = () => {
    timer = window.setTimeout(() => {
      onChange()
      schedule()
    }, 60_000 - (Date.now() % 60_000) + 50)
  }
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return
    clearTimeout(timer)
    onChange()
    schedule()
  }
  schedule()
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

const getTime = () => format.format(new Date())
// The export is static, so the server can't know the time: it ships dashes and
// the tiles flip to the visitor's current New York time once hydrated.
const getServerTime = () => '--:--'

export function LiveClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, getTime, getServerTime)

  return (
    <p className={['t-label', className].filter(Boolean).join(' ')}>
      <span className="sr-only">New York</span>
      <span className="text-ink-faint" aria-hidden="true">
        NYC{' '}
      </span>
      <SplitFlap text={time} trigger="none" drum={CLOCK_DRUM} />
      <span className="text-ink-faint" aria-hidden="true">
        {' '}
        Local
      </span>
      <span className="sr-only">{time === '--:--' ? '' : `, ${time}`}</span>
    </p>
  )
}
