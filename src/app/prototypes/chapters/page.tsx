import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Metadata } from 'next'
import { Doto } from 'next/font/google'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { ChapterMark } from '../_chapters/chapter-mark'
import { splitChapters, type Disc } from '../_chapters/chapters'
import { ChaptersLab } from '../_chapters/lab'

export const metadata: Metadata = { title: 'Chapters' }

// The on-screen display's dot-matrix numbers, as on a player's front panel. Loaded only here.
const doto = Doto({ subsets: ['latin'], variable: '--font-doto', preload: false })

/**
 * Every case study as a disc. The chapters come from the body's own "##"
 * headings, read from the MDX source; the body renders here on the server
 * with each heading swapped for its chapter's title card, so the lab can
 * measure where chapters start.
 */
export default async function ChaptersPage() {
  const discs: Disc[] = await Promise.all(
    work.map(async (meta) => {
      const source = await readFile(path.join(process.cwd(), 'content/work', meta.slug, 'body.mdx'), 'utf8')
      const chapters = splitChapters(source)
      const byTitle = new Map(chapters.filter((c) => !c.intro).map((c) => [c.title, c]))
      const { default: Body } = await import(`@/../content/work/${meta.slug}/body.mdx`)

      const h2 = ({ children }: { children?: React.ReactNode }) => {
        const chapter = byTitle.get(String(children))
        return chapter ? <ChapterMark chapter={chapter} /> : <h2>{children}</h2>
      }

      const body = (
        <>
          {chapters[0]?.intro && <ChapterMark chapter={chapters[0]} />}
          <Body components={{ h2 }} />
        </>
      )
      return { slug: meta.slug, chapters, body }
    }),
  )

  return <ChaptersLab items={withCovers(work)} discs={discs} fontClass={doto.variable} />
}
