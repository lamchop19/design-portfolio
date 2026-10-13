/**
 * What the UV lamp finds under each pass. Notes are drawn from the case study
 * text; the sketch and rejected-direction slots are placeholders until the
 * process files exist. Drop an image at `sketch` and it can replace the slot.
 */
export type Marks = {
  note: string
  sketch: string
  rejected: string
  stamp: string
}

export const marks: Record<string, Marks> = {
  'tech-nyu': {
    note: 'Every peer club was chasing Instagram. LinkedIn was the open lane, so we showed the people instead of the logistics.',
    sketch: 'content/work/tech-nyu/assets/process-01',
    rejected: 'Announcement-style posts, written for people already in the room',
    stamp: 'Inspected · NYC · 2025',
  },
  'startup-week': {
    note: 'One Figma file and clear guidelines kept output consistent across a team with uneven software skills.',
    sketch: 'content/work/startup-week/assets/process-01',
    rejected: 'Startup Week as a tech@nyu event, before it became its own destination',
    stamp: 'Inspected · NYC · 2025',
  },
  'nyu-sydney': {
    note: 'Postcards from the multicultural Sydney that the stereotypes leave out. Each one carries a note so the design does not carry the context alone.',
    sketch: 'content/work/nyu-sydney/assets/process-01',
    rejected: 'The postcard-cliché Sydney: harbour, bridge, opera house',
    stamp: 'Inspected · SYD · 2025',
  },
  shmeel: {
    note: 'No typographic identity existed, so an editorial serif held the lookbook together and set the elevated-streetwear register.',
    sketch: 'content/work/shmeel/assets/process-01',
    rejected: 'A consumer-style catalogue instead of a retailer document',
    stamp: 'Inspected · NYC · 2024',
  },
}

/** The passport's machine-readable zone, for the footer. */
export const MRZ = [
  'P<USALAM<<MARC<ANDRE<<<<<<<<<<<<<<<<<<<<<<<<',
  'BRAND<<SOCIAL<<CONTENT<<NYC<<SYD<<<<<<2024<25',
]
