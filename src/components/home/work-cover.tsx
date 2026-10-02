import Image from 'next/image'
import { ViewTransition } from 'react'

import { indexLabel, placeholder, type WorkItem } from '@/lib/work-items'

/**
 * A project's cover, filling its frame. With `morph`, a real cover carries the
 * shared view-transition name, so opening the case study morphs it into the
 * hero; only one mounted cover per project may carry it. Until a project has
 * artwork it shows a flat brand fill with its number.
 */
export function WorkCover({
  item,
  index,
  sizes,
  morph = true,
}: {
  item: WorkItem
  index: number
  sizes: string
  morph?: boolean
}) {
  const { meta, cover } = item
  if (!cover) {
    return (
      <div
        className="flex size-full items-start p-4 font-mono text-[clamp(3rem,8vw,7rem)] leading-none"
        style={{ background: placeholder(index).fill, color: placeholder(index).ink }}
      >
        {indexLabel(index)}
      </div>
    )
  }
  const image = (
    <Image
      src={cover.src}
      alt=""
      width={cover.width}
      height={cover.height}
      placeholder="blur"
      blurDataURL={cover.blurDataURL}
      sizes={sizes}
      className="size-full object-cover"
    />
  )
  if (!morph) return image
  return (
    <ViewTransition name={`cover-${meta.slug}`} share="morph" default="none">
      {image}
    </ViewTransition>
  )
}
