# Content

Everything editorial lives here. Nothing in this directory is code the site depends
on structurally — adding, editing or removing a case study is a content change.

## Adding a case study

    content/work/<slug>/
      meta.ts     project facts, validated by defineWork()
      body.mdx    the prose
      assets/     source-resolution images

Then import the new `meta` in `content/work/index.ts`.

Run `npm run images` (or just `npm run dev`, which does it first) to generate the
optimized derivatives. Reference images from MDX with paths relative to `content/`:

    <Figure src="work/shmeel/assets/spread-01.jpg" alt="…" caption="…" wide />

## Placeholder assets

`work/tech-nyu/assets/cover.jpg` is a generated placeholder, present so the hover
preview and the cover→hero morph can be seen working. Replace it — and add covers
for the other three projects — with real artwork.

## Copy status

The case study prose is migrated from the Framer site and lightly edited. It still
needs a pass from Marc, along with:

- an up-to-date bio in `site.ts` (the old one said "junior at NYU")
- the Startup Week dates, which conflict on the old site (timeline reads
  Jan–Mar 2025 but the takeaway refers to Startup Week 2026)
- a current resume at `public/resume.pdf`
