const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * Prefixes a public/ asset with the deploy's base path.
 *
 * next/link and next/image handle this themselves, but a plain <a href> to a
 * static file does not — under the project-site base path those would 404.
 */
export function asset(path: string) {
  return `${basePath}${path}`
}

/** The homepage draws its own header and footer. */
export function isHome(pathname: string) {
  return (pathname.replace(/\/+$/, '') || '/') === '/'
}

/** Pages that close with their own footer, or none: the homepage and the layout prototypes. */
export function drawsOwnFooter(pathname: string) {
  return isHome(pathname) || pathname.replace(/^\/+/, '').startsWith('prototypes')
}

/** Pages whose header carries the theme control, so the floating one stands aside. */
export function placesOwnShade(pathname: string) {
  return isHome(pathname) || pathname.replace(/^\/+/, '').startsWith('prototypes/flight-')
}
