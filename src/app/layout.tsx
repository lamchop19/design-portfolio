import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { SiteFooter } from '@/components/layout/site-footer'
import { SmoothScroll } from '@/components/layout/smooth-scroll'
import { WindowShade } from '@/components/layout/window-shade'
import { flapInitScript } from '@/lib/flap'
import { ogImage } from '@/lib/og'
import { themeInitScript } from '@/lib/theme'
import { workViewInitScript } from '@/lib/work-view'
import { site } from '@/../content/site'

import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
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
      className={`${display.variable} ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: flapInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: workViewInitScript }} />
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
