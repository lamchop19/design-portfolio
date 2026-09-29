export type SiteLink = {
  label: string
  href: string
  /** 'asset' links are files in public/ and need the deploy base path applied. */
  kind: 'external' | 'mail' | 'asset'
}

/**
 * Single source of truth for site-wide copy and links. Kept in content/ next to
 * the case studies so everything editorial lives in one place.
 */
export const site = {
  name: 'Marc Andre Lam',
  domain: 'marcalam.com',
  url: 'https://marcalam.com',

  /* TODO(content): confirm with Marc — the Framer site still says "junior at NYU". */
  headline: 'Building Brands & Communities',
  bio: 'Designer working across brand, social and graphic design — building identities for communities of people, not just products.',

  email: 'mlamchop23@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/marcalam/', kind: 'external' },
    { label: 'Email', href: 'mailto:mlamchop23@gmail.com', kind: 'mail' },
    // Re-enable once public/resume.pdf exists — shipping it now is a dead link.
    { label: 'Resume', href: '/resume.pdf', kind: 'asset', disabled: true },
  ].filter((link) => !('disabled' in link && link.disabled)) as SiteLink[],
}
