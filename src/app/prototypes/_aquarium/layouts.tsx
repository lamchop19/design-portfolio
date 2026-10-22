'use client'

import Link from 'next/link'
import { useState } from 'react'

import { asset } from '@/lib/paths'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

/*
 * Three ways to set the portfolio over the airbrushed aquarium
 * (scripts/generate-aquarium.tsx), each with the text in the middle so the
 * work is surrounded by the scene. All static; the scene is one image, wide
 * on landscape screens and tall on portrait ones. Styles in aquarium.css.
 */

export type LayoutProps = { items: WorkItem[] }

/** The tank: full-bleed behind everything. */
export function Scene({ className }: { className?: string }) {
  return (
    <picture className={['aq-scene', className].filter(Boolean).join(' ')}>
      <source media="(max-aspect-ratio: 4/5)" srcSet={asset('/aquarium/tall.webp')} />
      <img src={asset('/aquarium/wide.webp')} alt="" />
    </picture>
  )
}

const years = (items: WorkItem[]) => {
  const all = items.map((item) => item.meta.year)
  return `${Math.min(...all)}–${Math.max(...all)}`
}

function Links() {
  return (
    <ul className="aq-links">
      <li>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </li>
      {site.links
        .filter((link) => link.kind !== 'mail')
        .map((link) => (
          <li key={link.label}>
            <a
              href={link.kind === 'asset' ? asset(link.href) : link.href}
              {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {link.label} ↗
            </a>
          </li>
        ))}
    </ul>
  )
}

function Roles() {
  return (
    <ul className="aq-roles">
      {site.experience.map((role) => (
        <li key={role.role}>
          <span className="aq-strong">{role.org}</span>
          <span>{role.role}</span>
          <span className="aq-muted">{role.when}</span>
        </li>
      ))}
    </ul>
  )
}

function WorkList({ items }: LayoutProps) {
  return (
    <ul className="aq-works">
      {items.map((item) => (
        <li key={item.meta.slug}>
          <Link href={`/work/${item.meta.slug}`} className="aq-work">
            <span className="aq-work-title">{item.meta.title}</span>
            <span className="aq-muted">
              {item.meta.subtitle} · {item.meta.year}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** A section that opens and closes, after Frances Zhao's Works / Extras / Contact. Native <details>, so no script. */
function Fold({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="aq-fold" open={open}>
      <summary>
        <span>{title}</span>
        <span className="aq-fold-mark" aria-hidden="true" />
      </summary>
      <div className="aq-fold-body">{children}</div>
    </details>
  )
}

/* ---- 1. Centred card ---- */

/**
 * After franceszhao.ca, but centred: one frosted card in the middle of the
 * tank with the name, the bio, and the work, experience and contact as folds
 * (work open). The scene fills everything around it.
 */
export function CentredCard({ items }: LayoutProps) {
  return (
    <div className="aq aq-centred">
      <Scene />
      <section className="aq-card" aria-label="Portfolio">
        <h1 className="aq-name">{site.name}</h1>
        <p className="aq-bio">
          {site.bio} Based in New York, {years(items)}.
        </p>
        <Fold title="Work" open>
          <WorkList items={items} />
        </Fold>
        <Fold title="Experience">
          <Roles />
        </Fold>
        <Fold title="Contact">
          <Links />
        </Fold>
      </section>
    </div>
  )
}

/* ---- 2. Tank labels ---- */

/**
 * A small plaque in the middle (name, headline, bio), and each project as an
 * aquarium identification card floating in the water round it, numbered like
 * a species guide. Experience and contact are cards too, low on either side.
 * Everything is visible at once: no folds, no menus.
 */
export function TankLabels({ items }: LayoutProps) {
  return (
    <div className="aq aq-labels">
      <Scene />
      <div className="aq-labels-grid">
        <header className="aq-card aq-plaque">
          <p className="aq-kicker">Specimen guide · New York · {years(items)}</p>
          <h1 className="aq-name">{site.name}</h1>
          <p className="aq-lede">{site.headline}</p>
          <p className="aq-bio">{site.bio}</p>
        </header>
        {items.slice(0, 4).map((item, i) => (
          <Link key={item.meta.slug} href={`/work/${item.meta.slug}`} className="aq-card aq-tag" data-slot={i}>
            <span className="aq-kicker">No. {String(i + 1).padStart(2, '0')}</span>
            <span className="aq-work-title">{item.meta.title}</span>
            <span className="aq-muted">
              {item.meta.subtitle} · {item.meta.year}
            </span>
            <span className="aq-tag-go" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
        <section className="aq-card aq-tag aq-tag-wide" data-slot="roles" aria-label="Experience">
          <span className="aq-kicker">Experience</span>
          <Roles />
        </section>
        <section className="aq-card aq-tag aq-tag-wide" data-slot="contact" aria-label="Contact">
          <span className="aq-kicker">Contact</span>
          <Links />
        </section>
      </div>
    </div>
  )
}

/* ---- 3. Lamp tank ---- */

const TABS = ['Work', 'About', 'Experience', 'Contact'] as const
type Tab = (typeof TABS)[number]

/**
 * After the aquarium lamp: the scene sits inside a tank with a dark bezel
 * and a lit glass edge, and a plaque in the middle switches between work,
 * about, experience and contact with tabs. The name is on the tank's base
 * plate, like the lamp's badge.
 */
export function LampTank({ items }: LayoutProps) {
  const [tab, setTab] = useState<Tab>('Work')

  return (
    <div className="aq aq-lamp">
      <div className="aq-tank">
        <Scene />
        <span className="aq-glass" aria-hidden="true" />
        <section className="aq-card aq-lamp-card" aria-label="Portfolio">
          <div className="aq-tabs" role="tablist" aria-label="Sections">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={tab === name}
                aria-controls="aq-panel"
                className="aq-tab"
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div id="aq-panel" role="tabpanel" className="aq-panel">
            {tab === 'Work' && <WorkList items={items} />}
            {tab === 'About' && (
              <>
                <p className="aq-lede">{site.headline}</p>
                <p className="aq-bio">{site.bio}</p>
              </>
            )}
            {tab === 'Experience' && <Roles />}
            {tab === 'Contact' && <Links />}
          </div>
        </section>
      </div>
      <div className="aq-base">
        <h1 className="aq-badge">{site.name}</h1>
        <span className="aq-muted">New York · {years(items)}</span>
      </div>
    </div>
  )
}

export const LAYOUTS = [
  { id: 'centred', name: '1 · Centred card', note: 'Frances Zhao’s card, centred: name, bio, then Work (open), Experience and Contact as folds. The tank surrounds it on every side.', Component: CentredCard },
  { id: 'labels', name: '2 · Tank labels', note: 'A small plaque in the middle; each project an ID card floating in the water around it, like a species guide. Everything visible, nothing to open.', Component: TankLabels },
  { id: 'lamp', name: '3 · Lamp tank', note: 'The scene inside a bezelled tank like the aquarium lamp, a tabbed plaque in the middle, the name on the base plate.', Component: LampTank },
] as const

export type LayoutId = (typeof LAYOUTS)[number]['id']
