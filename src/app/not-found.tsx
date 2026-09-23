import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="px-(--page-margin) pt-[22vh] pb-[18vh]">
      <p className="font-mono text-xs tracking-wide text-ink-faint uppercase">404</p>
      <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2.25rem,7vw,5rem)] leading-[0.95] tracking-tight">
        This page doesn&rsquo;t exist.
      </h1>
      <Link
        href="/"
        className="mt-10 inline-block font-mono text-sm text-ink underline decoration-ink-faint underline-offset-4 transition-colors hover:decoration-accent"
      >
        Back to the index
      </Link>
    </div>
  )
}
