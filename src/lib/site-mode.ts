/**
 * `NEXT_PUBLIC_SITE=landing` builds the live landing on its own: the homepage
 * is the School landing (prototypes/_school) with Marc's look and placeholder
 * links, and the root layout drops the frame, footer and scene behind it.
 * `npm run deploy:landing` builds that and keeps only the homepage for Vercel.
 * Unset, the site builds as usual.
 */
export const LANDING_ONLY = process.env.NEXT_PUBLIC_SITE === 'landing'
