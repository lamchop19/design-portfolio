import type { MDXComponents } from 'mdx/types'

import { Figure } from '@/components/case-study/figure'

/**
 * Global MDX element mapping. Case study prose is a single measure-constrained
 * column; headings break out of the reading rhythm to mark section boundaries.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => (
      <h2 className="mt-20 mb-6 font-display text-3xl leading-tight tracking-tight md:text-4xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-12 mb-4 font-display text-xl leading-snug tracking-tight md:text-2xl">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mt-6 text-lg leading-relaxed text-ink-muted first:mt-0">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mt-6 list-disc space-y-2 pl-5 text-lg leading-relaxed text-ink-muted">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-6 list-decimal space-y-2 pl-5 text-lg leading-relaxed text-ink-muted">
        {children}
      </ol>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-ink underline decoration-ink-faint underline-offset-4 transition-colors hover:decoration-accent"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-10 border-l-2 border-accent pl-6 font-display text-2xl leading-snug text-ink">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
    hr: () => <hr className="my-16 border-rule" />,
    Figure,
    ...components,
  }
}
