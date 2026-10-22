/** The sessionStorage key that remembers the homepage's logo intro has played this visit. */
export const INTRO_KEY = 'mal-intro-seen'

/**
 * Runs in the document head before paint. The homepage opens on the maL intro
 * (components/brand/logo/logo-intro) once a visit, per tab, with JS and with
 * motion; `?intro` in the address plays it again. The attribute tells CSS to
 * hold the frame's mark for the landing. Without it the intro layer never
 * shows and the page is there from the first frame. `base` is the deploy's
 * base path, so only the homepage sets it.
 */
export const introInitScript = (base: string) => `try {
  var home = location.pathname.replace(/\\/+$/, '') === ${JSON.stringify(base)};
  var again = /[?&]intro\\b/.test(location.search);
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (home && !still && (again || !sessionStorage.getItem('${INTRO_KEY}'))) document.documentElement.dataset.intro = 'play';
} catch (e) {}`
