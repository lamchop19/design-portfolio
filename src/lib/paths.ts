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
