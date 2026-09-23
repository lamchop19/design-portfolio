/**
 * Single source of truth for site-wide copy and links. Kept in content/ next to
 * the case studies so everything editorial lives in one place.
 */
export const site = {
  name: 'Marc Alam',
  domain: 'marcalam.com',
  url: 'https://marcalam.com',

  /* TODO(content): confirm with Marc — the Framer site still says "junior at NYU". */
  headline: 'Building Brands & Communities',
  bio: 'Designer working across brand, social and graphic design — building identities for communities of people, not just products.',

  email: 'mlamchop23@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/marcalam/', external: true },
    { label: 'Email', href: 'mailto:mlamchop23@gmail.com', external: true },
    { label: 'Resume', href: '/resume.pdf', external: true },
  ],
} as const
