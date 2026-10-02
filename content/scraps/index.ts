export type Scrap = {
  /** Path relative to content/, e.g. "scraps/assets/poster-01.jpg". */
  src: string
  alt: string
  caption?: string
  year: number
  /** Give a piece more room in the grid. */
  wide?: boolean
}

/**
 * One-off graphics, posters and social sets that don't warrant a case study.
 * Drop a file in content/scraps/assets/ and add an entry here.
 */
export const scraps: Scrap[] = []
