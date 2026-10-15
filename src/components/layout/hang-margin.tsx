/**
 * The hanging margin: in a `.swiss-grid` row, columns 1–3 hold only small
 * facts and the content beside it starts at column 4 (`md:col-span-9`), so
 * every block shares one hard left edge. On phones the facts become a single
 * line above their block.
 */
export function HangMargin({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={['hang-margin t-label', className].filter(Boolean).join(' ')}>{children}</div>
}
