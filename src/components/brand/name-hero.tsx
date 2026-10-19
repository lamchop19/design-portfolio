/**
 * The wordmark: the name, set large in the site's typeface across the columns
 * it is given.
 */
export function NameHero({ name, className }: { name: string; className?: string }) {
  return <h1 className={['name-hero', className].filter(Boolean).join(' ')}>{name}</h1>
}
