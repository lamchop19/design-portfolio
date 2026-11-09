import { GUIDE_SECTIONS } from '@/lib/guide'

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

const trimmed = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

const isPrototype = (pathname: string) => trimmed(pathname).startsWith('/prototypes')

/** The homepage draws its own header and footer. */
export function isHome(pathname: string) {
  return trimmed(pathname) === '/'
}

/** The guide's screens: the homepage and the sections its menu opens. They draw their own logo and menu. */
export function isGuide(pathname: string) {
  return isHome(pathname) || GUIDE_SECTIONS.some((section) => section.href === trimmed(pathname))
}

/** Pages that close with their own footer, or none: the guide's screens and the prototypes. */
export function drawsOwnFooter(pathname: string) {
  return isGuide(pathname) || isPrototype(pathname)
}

/** The scene shows behind the site. The prototypes keep the grounds they were made on, apart from the guide lab. */
export function showsBackdrop(pathname: string) {
  return !isPrototype(pathname) || trimmed(pathname).startsWith('/prototypes/guide')
}
