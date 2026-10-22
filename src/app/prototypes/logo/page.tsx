import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Metadata } from 'next'

import { LogoLab, type Colorway } from '../_logo/lab'

export const metadata: Metadata = { title: 'Logo motion' }

const COLORWAYS: Colorway[] = ['blue', 'green', 'pink']

/** The Figma exports, read as markup so the lab can place them inline and animate their parts. */
export default async function LogoPage() {
  const files = await Promise.all(
    COLORWAYS.map(async (c) => [c, await readFile(path.join(process.cwd(), 'public/logo', `mal-${c}.svg`), 'utf8')] as const),
  )
  return <LogoLab svgs={Object.fromEntries(files) as Record<Colorway, string>} />
}
