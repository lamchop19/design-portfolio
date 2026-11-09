/*
 * The DVD menu's sections. The behaviour every layout shares, a highlight
 * that glides between items like a remote's, is useMenu in
 * components/menu/use-menu.
 */

export type SectionId = 'work' | 'experience' | 'about' | 'contact'

export type Section = {
  id: SectionId
  label: string
  /** What a disc would call it. */
  disc: string
  /** The neon the highlight turns when it lands here, and an ink that reads on it. */
  color: string
  on: string
}

/* Neons from the Rio Hostel fish: pink, yellow, green, electric blue. */
export const SECTIONS: Section[] = [
  { id: 'work', label: 'Featured Work', disc: 'Scene Selection', color: '#ff3d9a', on: '#120a10' },
  { id: 'experience', label: 'Experience', disc: 'Special Features', color: '#f2ff3a', on: '#14160a' },
  { id: 'about', label: 'About', disc: 'Director’s Commentary', color: '#25e46b', on: '#06170d' },
  { id: 'contact', label: 'Contact', disc: 'Set Up', color: '#2a5bff', on: '#ffffff' },
]

/** How long a screen takes to dissolve before the next comes up. Matches --dvd-cut in dvd.css. */
export const CUT_MS = 420

/** Custom properties that tint the highlight and the active item with a section's neon. */
export const tint = (section: Section) =>
  ({ '--hl': section.color, '--on-hl': section.on }) as React.CSSProperties
