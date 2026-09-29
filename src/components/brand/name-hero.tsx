import { NameSunlight } from '@/components/brand/name-sunlight'

export function NameHero({ name }: { name: string }) {
  return (
    <div className="name-hero-wrap">
      <NameSunlight />
      <h1 className="name-hero font-display">
        <span className="name-hero-text">{name.toUpperCase()}</span>
      </h1>
    </div>
  )
}
