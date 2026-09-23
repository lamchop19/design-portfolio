import type { MetadataRoute } from 'next'

import { site } from '@/../content/site'
import { work } from '@/../content/work'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, priority: 1 },
    { url: `${site.url}/scraps`, priority: 0.5 },
    ...work.map((w) => ({ url: `${site.url}/work/${w.slug}`, priority: 0.8 })),
  ]
}
