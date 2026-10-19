import Link from 'next/link'

import { WorkCover } from '@/components/home/work-cover'
import { asset } from '@/lib/paths'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { SeaNav } from './sea-nav'

import './sea.css'

/*
 * The portfolio as one scene, top to bottom: sky, the sea's surface with a
 * sailboat, open water with fish, and the floor with a submarine and coral.
 * Three screens that snap, over one continuous gradient, so the colour only
 * ever drifts. Props are watercolours from scripts/generate-sea.tsx.
 */

/** A painted prop, placed by CSS through its class. */
function Prop({ name, className, flip }: { name: string; className: string; flip?: boolean }) {
  // Prebuilt decorative webps, already sized and compressed: next/image would only add a loader.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={asset(`/sea/${name}.webp`)} alt="" className={['sea-prop', className].join(' ')} data-flip={flip || undefined} draggable={false} />
}

const years = (items: WorkItem[]) => {
  const all = items.map((item) => item.meta.year)
  return `${Math.min(...all)}–${Math.max(...all)}`
}

export function Sea({ items }: { items: WorkItem[] }) {
  return (
    <div className="sea" data-snap-type="mandatory">
      <SeaNav />

      <div className="sea-water" aria-hidden="true" />
      <Prop name="surface" className="sea-surface" />
      <Prop name="seabed" className="sea-seabed" />
      <div className="sea-paper" aria-hidden="true" style={{ '--paper': `url(${asset('/sea/paper.webp')})` } as React.CSSProperties} />

      {/* Above the fold: the name in the sky, the boat on the water. */}
      <section id="top" className="sea-layer sea-sky" data-snap aria-label="Introduction">
        <Prop name="cloud-1" className="sea-cloud-1" />
        <Prop name="cloud-2" className="sea-cloud-2" />
        <div className="sea-hero">
          <h1 className="sea-wordmark">{site.name}</h1>
          <p className="sea-oneliner">{site.headline} — brand, social and graphic design, New York.</p>
        </div>
        <Prop name="sailboat" className="sea-boat" />
      </section>

      {/* Open water: the work, with fish around it. */}
      <section id="work" className="sea-layer sea-mid" data-snap aria-labelledby="work-title">
        <Prop name="fish-1" className="sea-fish sea-fish-1" />
        <Prop name="fish-2" className="sea-fish sea-fish-2" flip />
        <Prop name="fish-3" className="sea-fish sea-fish-3" />
        <Prop name="fish-4" className="sea-fish sea-fish-4" flip />
        <Prop name="fish-7" className="sea-fish sea-fish-5" />
        <div className="sea-inner">
          <header className="sea-head">
            <p className="sea-kicker">Featured work · {years(items)}</p>
            <h2 id="work-title" className="sea-title">
              Work
            </h2>
          </header>
          <ul className="sea-works">
            {items.map((item, i) => (
              <li key={item.meta.slug}>
                <Link href={`/work/${item.meta.slug}`} transitionTypes={['nav-forward']} className="sea-card sea-work">
                  <span className="sea-work-cover">
                    <WorkCover item={item} index={i} sizes="(min-width: 768px) 22vw, 90vw" />
                  </span>
                  <span className="sea-work-title">{item.meta.title}</span>
                  <span className="sea-muted">
                    {item.meta.subtitle} · {item.meta.year}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The floor: about, experience and contact, beside the submarine. */}
      <section id="about" className="sea-layer sea-deep" data-snap aria-labelledby="about-title">
        <Prop name="coral-2" className="sea-coral sea-coral-1" />
        <Prop name="coral-1" className="sea-coral sea-coral-2" />
        <Prop name="submarine" className="sea-sub" />
        <Prop name="coral-3" className="sea-coral sea-coral-3" />
        <Prop name="coral-4" className="sea-coral sea-coral-4" />
        <Prop name="fish-6" className="sea-fish sea-fish-6" flip />
        <div className="sea-inner sea-deep-inner">
          <div className="sea-card sea-about">
            <p className="sea-kicker">About</p>
            <h2 id="about-title" className="sea-lede">
              {site.headline}
            </h2>
            <p className="sea-bio">{site.bio}</p>
            <p className="sea-kicker sea-gap">Experience</p>
            <ul className="sea-roles">
              {site.experience.map((role) => (
                <li key={role.role}>
                  <span className="sea-strong">{role.org}</span>
                  <span>{role.role}</span>
                  <span className="sea-muted">{role.when}</span>
                </li>
              ))}
            </ul>
            <div id="contact" className="sea-contact">
              <p className="sea-kicker sea-gap">Contact</p>
              <a href={`mailto:${site.email}`} className="sea-email">
                {site.email}
              </a>
              <ul className="sea-links">
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
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
