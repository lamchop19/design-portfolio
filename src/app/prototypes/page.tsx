import Link from 'next/link'

const prototypes = [
  { href: '/prototypes/logo', title: 'Logo motion', note: 'The maL mark from the “logos final” frame in three colourways: five load animations and five hovers that play with its gradients and noise' },
  { href: '/prototypes/dvd', title: 'DVD menu', note: 'The homepage as a disc’s main menu: seven layouts (two after chiquach.com and franceszhao.ca, and Split, a 40/60 site merging them) over airbrush fish, the PS3 wave or jellies, with a neon highlight that glides between items' },
  { href: '/prototypes/sea', title: 'Sea', note: 'One watercolour scene in three snapped screens: sky and sailboat, open water and the work, the floor with the submarine' },
  { href: '/prototypes/aquarium', title: 'Aquarium', note: 'An airbrushed tank of fish and coral behind the portfolio, with the text centred over it, three ways' },
  { href: '/prototypes/one-page', title: 'One page', note: 'The whole portfolio on one screen, four formats, with folk-plant flora in two-ink or full palette' },
  { href: '/prototypes/ocean', title: 'Ocean', note: 'Water treatments behind the specimen wallpaper, ink strengths, dot size and wordmark faces' },
  { href: '/prototypes/grid-styles', title: 'Grid styles', note: 'Hanging margin, ruled index, modular field and staggered columns on the same content' },
  { href: '/prototypes/nav-styles', title: 'Nav styles', note: 'Ruled strip, segmented pill, margin index and a bottom bar with a full-screen menu, on the ruled-index homepage' },
  { href: '/prototypes/bitmap', title: 'Bitmap specimens', note: 'Dithered shapes in soft inks in the ruled index’s cover cell: palettes, pixel sizes, live or pre-rendered' },
] as const

export default function PrototypesPage() {
  return (
    <div className="swiss-grid gap-y-8 py-16">
      <p className="t-label col-span-full text-ink-faint">Prototypes · not linked from the site</p>
      <ul className="col-span-full md:col-span-8">
        {prototypes.map((p) => (
          <li key={p.href} className="border-b border-rule">
            <Link href={p.href} className="flex items-baseline justify-between gap-6 py-5 transition-colors hover:text-accent">
              <span className="text-[32px] leading-10 font-medium tracking-[-0.02em]">{p.title}</span>
              <span className="t-label text-ink-faint">{p.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
