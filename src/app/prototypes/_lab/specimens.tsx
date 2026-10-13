import { flightCode } from '@/lib/work-items'
import { site } from '@/../content/site'
import { work } from '@/../content/work'

import { TYPE_OPTIONS, type TypeId } from './options'
import './lab.css'

/** Where each face comes from, for the sheet's margin. */
const origins: Record<TypeId, string> = {
  current: 'Geist by Vercel, with Geist Mono for every label and flap. What the site ships today.',
  cockpit:
    'B612 was commissioned by Airbus with ENAC and Intactile Design for cockpit screens: open counters and distinct shapes for reading at a glance, under turbulence.',
  highway:
    'Overpass is an open interpretation of Highway Gothic, the lettering on US road signs. It is the wayfinding voice without the airport cliché.',
  hyperlegible:
    'Atkinson Hyperlegible was drawn for the Braille Institute so similar letters (I, l, 1) never get confused. It is the "clear, unobscured text" principle as a typeface.',
  'dot-matrix':
    'Doto is a dot-matrix variable face on a 6 × 10 grid, with a roundness axis. It is used only for the big boards, where it reads like a departures display.',
  editorial:
    'Instrument Serif gives the headings a human, editorial voice next to the system-like mono, the two-voice lockup from the wrinkle board.',
}

/**
 * Every pairing set on the same real content, one after another, so they
 * can be compared without toggling. Each specimen is wrapped in the lab
 * class so it uses exactly the CSS the home lab does.
 */
export function Specimens({ fontVariables }: { fontVariables: string }) {
  const lead = work[0]

  return (
    <div className={`lab-specimens ${fontVariables}`}>
      <header className="swiss-grid gap-y-3 pt-6 pb-10">
        <p className="t-label col-span-full text-ink-faint">Type specimens · same content, six voices</p>
        <h1 className="col-span-full font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.04em]">
          Which voice boards the flight?
        </h1>
        <p className="col-span-full max-w-[60ch] text-ink-muted md:col-span-7">
          Switch these on the real homepage in the home lab. Here they sit side by side on the name, headline, bio, a
          boarding label and a board line.
        </p>
      </header>

      {TYPE_OPTIONS.map((option) => (
        <section key={option.id} className="lab lab-specimen swiss-grid" data-type={option.id} aria-labelledby={`spec-${option.id}`}>
          <div className="col-span-full grid content-start gap-2 md:col-span-3">
            <h2 id={`spec-${option.id}`} className="t-label">
              {option.label}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">{origins[option.id]}</p>
          </div>

          <div className="col-span-full grid min-w-0 gap-5 md:col-span-9">
            <p className="lab-spec-board">
              MARC ANDRE LAM
            </p>
            <div className="grid gap-4">
              <p className="lab-spec-heading">Hi, I’m Marc. I build brands for communities.</p>
              <p className="lab-spec-strap">{site.headline}</p>
            </div>
            <p className="max-w-[60ch] text-lg leading-relaxed text-ink-muted">{site.bio}</p>
            <div className="lab-spec-labels">
              <span className="t-label">
                Flight {flightCode(lead)} · Gate 01A · {lead.subtitle}
              </span>
              <span className="t-label text-ink-faint">Il1 O0 rn m · 0123456789</span>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
