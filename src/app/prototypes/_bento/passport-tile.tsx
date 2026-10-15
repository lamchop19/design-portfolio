'use client'

import { startTransition, useEffect, useId, useLayoutEffect, useRef, useState, ViewTransition } from 'react'
import { Maximize2, Sparkles, X } from 'lucide-react'

import { site } from '@/../content/site'

import { roles } from '../_flight/legs'
import { PassportBook, PassportCover, PassportSpread } from '../_passport/passport-book'
import { ScaleToFit } from './scale-to-fit'
import { TileHead } from './tiles'

/** How long the cover takes to fly from the tile to the takeover, before it swings open. */
const MORPH_MS = 420

/**
 * About, as a passport on the desk: the closed cover, a hello and where Marc
 * is now. Opening it flies the booklet up over the grid, where it opens to
 * the full identity and journey spread.
 */
export function PassportTile({ className, no = '03' }: { className?: string; no?: string }) {
  const [open, setOpen] = useState(false)
  const now = roles[0]

  const show = (value: boolean) => startTransition(() => setOpen(value))

  return (
    <section className={['tile tile-passport', className].filter(Boolean).join(' ')} aria-label="About">
      <TileHead no={no} label="Passport control" picto="info" aside={`${roles.length} stamps`} />
      <div className="tile-body passport-tile">
        <button type="button" className="passport-thumb" onClick={() => show(true)} aria-haspopup="dialog" aria-label="Open passport">
          {open ? null : (
            <ViewTransition name="bento-passport" share="morph" default="none">
              <ScaleToFit width={500} height={560} className="size-full">
                <PassportCover />
              </ScaleToFit>
            </ViewTransition>
          )}
        </button>
        <div className="passport-note">
          <div>
            <p className="text-[22px] leading-7 font-medium md:text-[26px] md:leading-8">Hi, I’m Marc<span className="text-accent">.</span></p>
            <p className="passport-bio mt-2 text-[15px] leading-6 text-ink-muted">{site.bio}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <p className="t-label">
              <span className="text-ink-faint">Now · </span>
              {now.role}, {now.org}
            </p>
            <button type="button" className="bento-button t-label" onClick={() => show(true)} aria-haspopup="dialog">
              Open passport <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
      </div>
      <PassportTakeover open={open} onClose={() => show(false)} />
    </section>
  )
}

/**
 * About, with the passport already open on the desk: a hello, the spread
 * scaled to the tile, and a button that lifts it up full size.
 */
export function PassportOpenTile({ className, no = '02' }: { className?: string; no?: string }) {
  const [open, setOpen] = useState(false)
  const show = (value: boolean) => startTransition(() => setOpen(value))

  return (
    <section className={['tile tile-passport-open', className].filter(Boolean).join(' ')} aria-labelledby="passport-hello">
      <TileHead no={no} label="Passport control" picto="info" aside="MAL / 001" />
      <div className="tile-body passport-open-tile">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="passport-hello" className="text-[26px] leading-8 font-medium md:text-[32px] md:leading-10">
            Hi, I’m Marc<span className="text-accent">.</span>
          </h2>
          <button type="button" className="bento-button t-label" onClick={() => show(true)} aria-haspopup="dialog">
            Expand passport <Maximize2 size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="passport-preview">
          {open ? null : (
            <ViewTransition name="bento-passport" share="morph" default="none">
              <ScaleToFit width={1000} height={640} className="size-full">
                <PassportSpread />
              </ScaleToFit>
            </ViewTransition>
          )}
        </div>
      </div>
      <PassportTakeover open={open} onClose={() => show(false)} startOpen no={no} />
    </section>
  )
}

/** The booklet over everything, in a modal dialog. Esc or the close button returns it to the tile. */
export function PassportTakeover({
  open,
  onClose,
  startOpen = false,
  no = '03',
}: {
  open: boolean
  onClose: () => void
  /** Arrive already open (when the tile showed it open), instead of landing closed and swinging open. */
  startOpen?: boolean
  no?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closer = useRef<HTMLButtonElement>(null)
  const spreadId = useId()
  const [spread, setSpread] = useState(startOpen)
  const [lightPass, setLightPass] = useState(0)

  // Shown in the same commit as the morph, so the view transition sees it.
  useLayoutEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      closer.current?.focus()
    }
    if (!open && el.open) el.close()
  }, [open])

  // Once the cover has landed, it swings open. Reduced motion opens it straight away.
  useEffect(() => {
    if (!open || startOpen) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setSpread(true), reduced ? 0 : MORPH_MS)
    return () => {
      clearTimeout(timer)
      setSpread(false)
    }
  }, [open, startOpen])

  return (
    <dialog
      ref={dialog}
      className="passport-takeover"
      aria-label="Passport"
      data-lenis-prevent
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {open ? (
        <div className="passport-takeover-inner">
          <div className="flex items-center justify-between gap-4 pb-4">
            <p className="t-label">
              <span className="text-ink-faint">{no} </span>Passport control
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="bento-button bento-button-quiet t-label" onClick={() => setLightPass((value) => value + 1)}>
                <Sparkles size={14} aria-hidden="true" /> Catch the light
              </button>
              <button ref={closer} type="button" className="bento-button t-label" onClick={onClose}>
                Back to the terminal <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
          <ViewTransition name="bento-passport" share="morph" default="none">
            <PassportBook open={spread} onOpen={() => setSpread(true)} lightPass={lightPass} spreadId={spreadId} />
          </ViewTransition>
        </div>
      ) : null}
    </dialog>
  )
}
