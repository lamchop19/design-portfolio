import { z } from 'zod'

/**
 * Case study metadata lives in a `meta.ts` beside each `body.mdx` rather than in
 * MDX frontmatter. That keeps the work index cheap — it imports only metadata,
 * never the prose — and gives the fields real types at the call site.
 */
export const workMetaSchema = z.object({
  /** URL segment. Must match the containing directory name. */
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  /** The discipline line under the title, e.g. "brand & social". */
  subtitle: z.string(),
  /** The one-sentence claim the case study argues. */
  headline: z.string(),

  role: z.string(),
  timeline: z.string(),
  team: z.string(),
  client: z.string(),
  clientUrl: z.url().optional(),
  /** Sorts the index, newest first. */
  year: z.number().int(),

  /** Path relative to content/, e.g. "work/shmeel/assets/cover.jpg". */
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
})

export type WorkMeta = z.infer<typeof workMetaSchema>
export type WorkMetaInput = z.input<typeof workMetaSchema>

/** Validates at module load so a malformed case study fails the build loudly. */
export function defineWork(input: WorkMetaInput): WorkMeta {
  const result = workMetaSchema.safeParse(input)
  if (!result.success) {
    throw new Error(
      `Invalid work metadata for "${input.slug ?? '(unknown)'}":\n${z.prettifyError(result.error)}`,
    )
  }
  return result.data
}
