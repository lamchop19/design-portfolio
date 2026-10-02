import Link from 'next/link'

import { Barcode } from '@/components/brand/barcode'
import { WorkCover } from '@/components/home/work-cover'
import { FlapText } from '@/components/split-flap/split-flap'
import { flightCode, placeholder, seatLabel, type WorkItem } from '@/lib/work-items'

type BoardingPassProps = {
  item: WorkItem
  /** The project's place in the running order: its seat number and accent colour. */
  index: number
  /**
   * `card` is the homepage ticket: a link, with a thumbnail, lying on its side
   * from tablet up. `rail` is the case study sidebar: upright, no thumbnail
   * (the hero sits above it), with the client linked and the tags on the stub.
   */
  variant: 'card' | 'rail'
  /** Carry the cover's shared view-transition name (see WorkCover). */
  morph?: boolean
}

/**
 * A project as a boarding pass: an accent band, the ticket body with the
 * project facts, and a perforated stub carrying the seat and a barcode. The
 * flight code, seat and title flip in as the pass comes into view.
 */
export function BoardingPass({ item, index, variant, morph = true }: BoardingPassProps) {
  const { meta } = item
  const flight = flightCode(meta)
  const seat = seatLabel(index)
  const card = variant === 'card'

  const client =
    !card && meta.clientUrl ? (
      <a href={meta.clientUrl} target="_blank" rel="noreferrer" className="underline decoration-ink-faint underline-offset-3 hover:text-accent">
        {meta.client}
      </a>
    ) : (
      meta.client
    )

  const fields: Array<[string, React.ReactNode]> = [
    ['Client', client],
    ['Role', meta.role],
    ['Timeline', meta.timeline],
    ['Team', meta.team],
  ]

  const pass = (
    <>
      <div className="pass-main">
        <span className="pass-band" style={{ background: placeholder(index).fill }} />
        {card ? (
          <div className="pass-thumb">
            <WorkCover item={item} index={index} sizes="(min-width: 768px) 16vw, 100vw" morph={morph} />
          </div>
        ) : null}
        <div className="pass-body">
          <div className="t-label flex justify-between gap-4 text-ink-faint">
            <span>Boarding pass</span>
            <span>
              Flight <FlapText text={flight} className="text-ink" trigger="visible" intro="quick" />
            </span>
          </div>
          {card ? (
            <FlapText
              text={meta.title}
              className="pass-title"
              trigger="visible"
              intro="quick"
              delay={120}
            />
          ) : null}
          <dl className="pass-fields">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="t-label text-ink-faint">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="t-label mt-auto">
            <span className="text-ink-faint">Class </span>
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="pass-stub">
        <div>
          <p className="t-label text-ink-faint">Seat</p>
          <FlapText text={seat} className="pass-seat" trigger="visible" intro="quick" delay={200} />
        </div>
        <Barcode value={`${flight}${meta.slug}`} className="pass-barcode" />
        {!card && meta.tags.length > 0 ? (
          <p className="t-label basis-full text-ink-faint">
            <span className="sr-only">Tags: </span>
            {meta.tags.join(' · ')}
          </p>
        ) : null}
      </div>
    </>
  )

  if (!card) return <aside aria-label="Project details" className="pass pass-rail">{pass}</aside>

  return (
    <Link
      href={`/work/${meta.slug}`}
      transitionTypes={['nav-forward']}
      aria-label={`${meta.title}, ${meta.subtitle}, ${meta.year}`}
      className="pass pass-card"
    >
      {pass}
    </Link>
  )
}
