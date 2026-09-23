import Image from 'next/image'

import { getImage } from '@/lib/images'

type FigureProps = {
  /** Path relative to content/, e.g. "work/shmeel/assets/spread-01.jpg". */
  src: string
  alt: string
  caption?: string
  /** Break out of the text measure to the full content width. */
  wide?: boolean
}

/**
 * The image primitive for case studies. Dimensions and the blur placeholder come
 * from the build-time manifest, so images never cause layout shift.
 */
export function Figure({ src, alt, caption, wide = false }: FigureProps) {
  const image = getImage(src)

  return (
    <figure className={wide ? 'mt-16 md:-mx-[12vw]' : 'mt-16'}>
      <Image
        src={image.src}
        alt={alt}
        width={image.width}
        height={image.height}
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        sizes={wide ? '100vw' : '(min-width: 768px) 70ch, 100vw'}
        className="h-auto w-full bg-surface-raised"
      />
      {caption ? (
        <figcaption className="mt-3 font-mono text-xs text-ink-faint">{caption}</figcaption>
      ) : null}
    </figure>
  )
}
