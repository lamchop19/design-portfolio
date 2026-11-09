/**
 * The homepage's layouts, all on the site's 12-column grid (guide.css):
 *
 * - index: after jadefranson.com. The mark and an index menu top left, the
 *   sentence bottom right, the scene boxes where her clock sits.
 * - statement: the sentence as the headline, the menu in four columns
 *   along the foot, after Craft and Freshman.
 * - axis: the mark right-aligned to the page's centre line, the sentence and
 *   menu hung off the other side of it, after Oevra.
 * - table: the menu as an index table with what each section holds, after
 *   Waka Waka.
 * - split: the sentence as one line over a rule, the menu big in the left
 *   half with superscript numbers, after Analogue.
 * - masthead: the wireframe, centred, with its menu in ruled cells.
 * - channel: centred, with the menu as the Sky Guide's list.
 */
export type LayoutId = 'index' | 'statement' | 'axis' | 'table' | 'split' | 'masthead' | 'channel'

/** The faces the guide lab tries, by data-type on the guide's root; see guide.css. */
export type TypeId = 'wireframe' | 'serif-mono' | 'mono' | 'broadcast' | 'grotesk-mono' | 'dot' | 'bricolage'

/** How the guide looks: the choices /prototypes/guide puts side by side. */
export type GuideLook = {
  layout: LayoutId
  type: TypeId
  /** Deep blue holds 4.5:1 over every scene; brand blue only 3:1 under a heavy veil. */
  ink: 'deep' | 'blue' | 'black'
  /** The highlight: a block of brand blue with paper type on it, or Sky's yellow with ink. */
  highlight: 'blue' | 'yellow'
}

/** The homepage's picks. TODO(design): Marc's choices from /prototypes/guide. */
export const GUIDE_LOOK: GuideLook = { layout: 'index', type: 'wireframe', ink: 'deep', highlight: 'blue' }

/** Layouts whose menu runs across the page rather than down it. */
export const ACROSS: LayoutId[] = ['statement', 'masthead']
