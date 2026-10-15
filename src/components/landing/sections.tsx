'use client'

import { HangMargin } from '@/components/layout/hang-margin'
import { ArrivalBoard, Stamp } from '@/app/prototypes/_flight/leg-content'
import { asset } from '@/lib/paths'
import { site } from '@/../content/site'

import { roles } from './legs'

/*
 * The homepage's later legs on the hanging margin: columns 1–3 carry a fact
 * or two, and every block starts at column 4. Phones stack them, facts first.
 */

export function AboutSection() {
  return (
    <div className="swiss-grid h-full min-h-[inherit] content-center items-start gap-y-10 pt-24 pb-28">
      <HangMargin>
        <p>New York City</p>
        <p>Window seat, always</p>
      </HangMargin>
      <div className="col-span-full md:col-span-5 lg:col-span-6">
        <h2 className="text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.035em] text-balance">
          Hi, I’m Marc.<span data-detail> I build brands for communities, not just products.</span>
        </h2>
        <p className="mt-6 max-w-[52ch] text-lg leading-7 text-ink-muted">{site.bio}</p>
      </div>
      <div className="col-span-3 md:col-span-4 lg:col-span-3">
        <div className="flight-window">
          <div className="flight-hatch grid size-full place-items-center">
            <span className="t-label">Portrait · placeholder</span>
          </div>
          <span className="flight-window-blind" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export function ExperienceSection() {
  return (
    <div className="swiss-grid h-full min-h-[inherit] content-center gap-y-10 pt-24 pb-28">
      <HangMargin>
        <p>New York</p>
        <p>Sydney</p>
      </HangMargin>
      <h2 className="col-span-full text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] font-medium tracking-[-0.045em] md:col-span-9">
        Where I’ve been
      </h2>
      <div className="relative col-span-full h-[300px] md:col-span-9 md:col-start-4 md:h-[min(46svh,400px)] lg:col-span-4 lg:col-start-4">
        {roles.map((role, i) => (
          <Stamp key={role.role} role={role} i={i} />
        ))}
      </div>
      <table className="t-label col-span-full self-center md:col-span-9 md:col-start-4 lg:col-span-5 lg:col-start-8">
        <caption className="sr-only">Experience</caption>
        <thead className="text-ink-faint">
          <tr className="border-b border-rule">
            <th className="py-2 text-left font-normal">Origin</th>
            <th className="py-2 text-left font-normal">Role</th>
            <th className="py-2 text-right font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.role} className="border-b border-rule">
              <td className="py-3 pr-4">{role.org}</td>
              <td className="py-3 pr-4">{role.role}</td>
              <td className="py-3 text-right whitespace-nowrap">{role.when}</td>
            </tr>
          ))}
          <tr data-detail className="bg-ink text-surface">
            <td className="py-3 pr-4 pl-2">Your team</td>
            <td className="py-3 pr-4">Next destination</td>
            <td className="py-3 pr-2 text-right">Boarding</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function ContactSection({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="relative h-full min-h-[inherit] overflow-hidden">
      <div className="flight-city" aria-hidden="true" />
      <div className="swiss-grid relative h-full min-h-[inherit] content-center gap-y-12 pt-24 pb-28">
        <ArrivalBoard className="col-span-full md:col-span-9 md:col-start-4" />

        <a
          href={`mailto:${site.email}`}
          className="t-riso col-span-full text-[clamp(1.75rem,5vw,4.5rem)] leading-[1.05] font-medium tracking-[-0.035em] break-all transition-colors hover:text-accent md:col-span-9 md:col-start-4"
        >
          {site.email}
        </a>

        {/* The margin signs the page off; the links line up on the content's columns. */}
        <div className="t-label rule-draw col-span-full grid grid-cols-subgrid gap-y-3 pt-4">
          <HangMargin>Operated by {site.name}</HangMargin>
          <ul className="col-span-2 flex gap-4 md:col-span-3">
            {site.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.kind === 'asset' ? asset(link.href) : link.href}
                  {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="transition-colors hover:text-accent"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="col-span-2 md:col-span-3">
            <span className="flight-ph px-1" title="Placeholder: résumé PDF not uploaded yet">
              Résumé.pdf
            </span>
          </p>
          <button
            type="button"
            onClick={onReturn}
            className="col-span-full text-left transition-colors hover:text-accent md:col-span-3 md:text-right"
          >
            Return to gate ↺
          </button>
        </div>
      </div>
    </div>
  )
}
