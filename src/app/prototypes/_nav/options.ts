export type NavStyleId = 'strip' | 'pill' | 'margin' | 'menu'

type Ref = { name: string; url: string }

/** The nav styles under trial, each with the Mobbin sections it draws on. */
export const NAV_STYLES: Array<{ id: NavStyleId; name: string; note: string; refs: Ref[] }> = [
  {
    id: 'strip',
    name: 'Ruled strip',
    note: 'A sticky strip in hairline cells on the grid: the name once the wordmark has gone, the sections as one line, the time in New York and the theme toggle.',
    refs: [
      { name: 'Waka Waka', url: 'https://mobbin.com/sites/sections/082e8338-c62d-4080-a4a0-a5a8a8caa6ac' },
      { name: 'SOTF', url: 'https://mobbin.com/sites/sections/c2b03cf7-6f55-431f-8876-0f56beecba25' },
      { name: 'Monte', url: 'https://mobbin.com/sites/sections/2f083c6a-8cf1-40af-823b-bee1ce8f419a' },
    ],
  },
  {
    id: 'pill',
    name: 'Segmented pill',
    note: 'Two small capsules float over the page: the sections on the left with the one in view filled, how far down you are, and the clock and theme toggle on the right.',
    refs: [
      { name: 'MOUTHWASH', url: 'https://mobbin.com/sites/sections/672c2210-6085-428a-920f-c03f1b5933be' },
      { name: 'Analogue', url: 'https://mobbin.com/sites/sections/2897fc9c-97a9-48e6-9b96-ea02583b012d' },
      { name: 'Fourmula', url: 'https://mobbin.com/sites/sections/3332ff1d-967c-4f6a-99fa-f9a4734c181b' },
    ],
  },
  {
    id: 'margin',
    name: 'Margin index',
    note: 'The sections stacked in the first columns of a sticky header, each with a dot in a route colour; the dot of the one in view lights.',
    refs: [
      { name: 'In Common With', url: 'https://mobbin.com/sites/sections/081509cf-757c-4c5a-bc9d-2375404f50f4' },
      { name: 'mymind', url: 'https://mobbin.com/sites/sections/cdf27cb7-276f-4178-ba89-a8aae4dc2b9a' },
      { name: 'Cloudstudio', url: 'https://mobbin.com/sites/sections/ab45d207-6127-4880-8793-d3da9da07c77' },
    ],
  },
  {
    id: 'menu',
    name: 'Bottom bar + menu',
    note: 'A bar docked at the foot of the screen names where you are; Menu opens a full-screen list on hairlines, set like the index itself. Esc closes it.',
    refs: [
      { name: 'Büro', url: 'https://mobbin.com/sites/sections/96246ad7-c31d-4134-b867-1c73db9fcb78' },
      { name: 'Freshman', url: 'https://mobbin.com/sites/sections/1a15a6d9-be03-4761-9a3a-30ec06495846' },
    ],
  },
]
