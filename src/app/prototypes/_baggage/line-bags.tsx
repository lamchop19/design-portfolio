import { Sheet } from './bake'

/**
 * Luggage as ink outlines filled with the page surface, like the rest of the
 * site's line work. Baked once per theme (light and dark ink and surface);
 * the only colour on the belt is on the tags.
 */

export type LineKind = 'suitcase' | 'duffel' | 'hatbox' | 'shell' | 'dome' | 'backpack'

export const lineSize: Record<LineKind, [number, number]> = {
  suitcase: [120, 158],
  duffel: [192, 88],
  hatbox: [124, 124],
  shell: [172, 126],
  dome: [154, 104],
  backpack: [128, 146],
}

const open = { fill: 'none' } as const

const ART: Record<LineKind, React.ReactNode> = {
  suitcase: (
    <>
      <rect x="44" y="3" width="32" height="14" rx="5" {...open} />
      <rect x="6" y="14" width="108" height="134" rx="12" />
      <path d="M42 14v134M78 14v134" {...open} />
      <circle cx="24" cy="152" r="5" fill="currentColor" />
      <circle cx="96" cy="152" r="5" fill="currentColor" />
    </>
  ),
  duffel: (
    <>
      <rect x="4" y="12" width="184" height="72" rx="36" />
      <path d="M72 40C76 4 116 4 120 40M80 40C84 14 108 14 112 40" {...open} strokeLinecap="round" />
      <path d="M24 48H168" {...open} strokeDasharray="4 4" />
      <rect x="160" y="43" width="12" height="10" rx="2" fill="currentColor" />
    </>
  ),
  hatbox: (
    <>
      <circle cx="62" cy="62" r="58" />
      <circle cx="62" cy="62" r="44" {...open} />
      <path d="M62 4v116" {...open} strokeDasharray="4 4" />
    </>
  ),
  shell: (
    <>
      <rect x="0" y="42" width="14" height="42" rx="5" />
      <rect x="10" y="6" width="152" height="114" rx="14" />
      <path d="M50 6v114M86 6v114M122 6v114" {...open} />
      <circle cx="160" cy="12" r="5" fill="currentColor" />
      <circle cx="160" cy="114" r="5" fill="currentColor" />
    </>
  ),
  dome: (
    <>
      <path d="M96 30C104 0 140 4 132 36" {...open} strokeLinecap="round" />
      <path d="M4 100A73 73 0 0 1 150 100Z" />
      <path d="M22 100A55 55 0 0 1 132 100" {...open} strokeDasharray="4 4" />
    </>
  ),
  backpack: (
    <>
      <path d="M50 18C50 2 78 2 78 18" {...open} strokeLinecap="round" />
      <rect x="0" y="40" width="14" height="70" rx="6" />
      <rect x="114" y="40" width="14" height="70" rx="6" />
      <rect x="12" y="14" width="104" height="128" rx="30" />
      <path d="M12 48Q64 66 116 48" {...open} />
      <rect x="30" y="78" width="68" height="50" rx="14" />
    </>
  ),
}

const THEMES = {
  light: { ink: '#0a0f1f', surface: '#ffffff' },
  dark: { ink: '#f5f7fa', surface: '#0b0d14' },
}

/** The bag as a standalone document in one theme's ink and surface. */
export function LineDocument({ kind, theme }: { kind: LineKind; theme: keyof typeof THEMES }) {
  const [w, h] = lineSize[kind]
  const { ink, surface } = THEMES[theme]
  return (
    <Sheet w={w} h={h} fill={surface} stroke={ink} color={ink} strokeWidth="2" strokeLinejoin="round">
      {ART[kind]}
    </Sheet>
  )
}
