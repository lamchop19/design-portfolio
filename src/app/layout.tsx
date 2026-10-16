import type { Metadata } from 'next'
import { Bricolage_Grotesque, Doto } from 'next/font/google'
import localFont from 'next/font/local'

import { SiteFooter } from '@/components/layout/site-footer'
import { SmoothScroll } from '@/components/layout/smooth-scroll'
import { WindowShade } from '@/components/layout/window-shade'
import { flapInitScript } from '@/lib/flap'
import { introInitScript } from '@/lib/intro'
import { ogImage } from '@/lib/og'
import { themeInitScript } from '@/lib/theme'
import { workViewInitScript } from '@/lib/work-view'
import { site } from '@/../content/site'

import './globals.css'

// The site sets everything in Paper Mono. Bricolage stays for the prototypes
// that still use it (through --font-display), unpreloaded so pages that don't
// use it never download it.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: false,
})

// Paper Mono, the site's one typeface: a variable font from Thin to ExtraBold.
// SIL OFL, see src/fonts/paper-mono.
const paperMono = localFont({
  src: '../fonts/paper-mono/PaperMono-Variable.woff2',
  variable: '--font-paper-mono',
  weight: '100 800',
  display: 'swap',
})

// Doto, a dot-matrix face for project titles: the wordmark's lamps in type.
// SIL OFL.
const dot = Doto({
  subsets: ['latin'],
  variable: '--font-dot',
  display: 'swap',
  axes: ['ROND'],
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.headline}`,
    template: `%s — ${site.name}`,
  },
  description: site.bio,
  openGraph: {
    type: 'website',
    siteName: site.name,
    url: site.url,
    images: [{ url: ogImage('index'), width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${paperMono.variable} ${dot.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: flapInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: workViewInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: introInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SmoothScroll />
        <WindowShade />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
