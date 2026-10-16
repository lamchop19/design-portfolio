/** The sessionStorage key that remembers the homepage's LED intro has played this visit. */
export const LED_INTRO_KEY = 'led-intro-seen'

// Runs in the document head before paint. The homepage's LED intro and the
// drop that follows it play once a visit (per tab), with JS and with motion;
// the attribute tells CSS to hold the page for them. Without it the intro
// layer never shows and the page is there from the first frame.
export const introInitScript = `try {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !sessionStorage.getItem('${LED_INTRO_KEY}')) document.documentElement.dataset.ledIntro = 'play';
} catch {}`
