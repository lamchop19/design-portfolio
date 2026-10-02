/**
 * Reading-progress bar for long case studies. Pure CSS via a scroll-driven
 * animation (see .scroll-progress in globals.css) — it is display:none where the
 * browser lacks support, so it costs nothing and never needs JS.
 */
export function ScrollProgress() {
  return <div className="scroll-progress" aria-hidden />
}
