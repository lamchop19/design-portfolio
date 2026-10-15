'use client'

import Link from 'next/link'
import { useId, useRef, useState } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'

import { site } from '@/../content/site'

import { PassportBook } from './passport-book'
import styles from './passport.module.css'

/** One booklet, with route-owned initial state; nothing is saved between visits. */
export function PassportAbout({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  const [lightPass, setLightPass] = useState(0)
  const toggle = useRef<HTMLButtonElement>(null)
  const spreadId = useId()

  return (
    <div className={styles.prototype}>
      <header className={styles.topbar}>
        <Link href="/prototypes" className={styles.back}><ArrowLeft size={14} /> All experiments</Link>
        <span className={styles.edition}>Personal effects / No. 03</span>
      </header>

      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}><span /> About the passenger</p>
          <h1>A little more personal.</h1>
        </div>
        <p className={styles.introNote}>A few things I carry with me.<br />An identity, a point of view, a few places along the way.</p>
      </div>

      <nav className={styles.versions} aria-label="Passport prototypes">
        <span>Start with</span>
        <Link href="/prototypes/passport" aria-current={!initialOpen ? 'page' : undefined}>01 / Closed cover</Link>
        <Link href="/prototypes/passport-open" aria-current={initialOpen ? 'page' : undefined}>02 / Open spread</Link>
      </nav>

      <PassportBook
        open={open}
        onOpen={() => { setOpen(true); toggle.current?.focus({ preventScroll: true }) }}
        lightPass={lightPass}
        spreadId={spreadId}
      />

      <div className={styles.controls}>
        <p><span className={styles.statusDot} />{open ? 'A closer look' : 'Ready when you are'}<span className={styles.desktopHint}> / {open ? 'Move your cursor to catch the foil' : 'Open the cover to meet the passenger'}</span></p>
        <div className={styles.buttons}>
          <button type="button" className={styles.lightButton} onClick={() => setLightPass((value) => value + 1)}><Sparkles size={15} /> Catch the light</button>
          <button ref={toggle} type="button" className={styles.toggleButton} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={spreadId}>{open ? 'Close passport' : 'Open passport'}<span aria-hidden="true">{open ? '−' : '+'}</span></button>
        </div>
      </div>
      <footer className={styles.footer}><span>{site.name} / About experiment</span><span>Identity is a work in progress.</span></footer>
    </div>
  )
}
