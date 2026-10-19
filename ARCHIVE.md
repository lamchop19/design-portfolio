# Archive: the airplane theme

The airport/airplane version of the portfolio was taken off the site in October
2026 to start a new direction from a neutral base. Nothing was thrown away. The
whole thing, live site and prototypes, is saved in git under the tag
**`archive/airplane-theme`** (commit `f8dad8a`).

## What's in it

**Live site pieces**

- Split-flap wordmark and labels (`SplitFlap`, `FlapText`, the WELCOME ABOARD preroll)
- LED lamp-board wordmark and the full-screen LED intro, with the rows dropping in after it
- Boarding passes: the homepage "Passes" view and the case-study sidebar
- The window-shade theme toggle (drag the blind for dark mode)
- Departures/gate/flight copy, the "Gate not found" 404, flight codes and seat numbers
- Doto dot-matrix project titles with riso misregistration
- Ocean footer with the pixel crab, baggage hall, landing "legs" (Gate → Arrival)

**Prototypes** (all under `/prototypes/…` in that version)

| Group | Pages |
| --- | --- |
| The Flight | flight-vertical, flight-signs, flight-horizontal, flight-home-lab, flip |
| Bento terminal | bento-split, bento-board, bento-intro, bento-floorplan |
| Passport | passport, passport-open |
| Cabin and airport | baggage-claim, seatback, blacklight, hero-load |
| Layouts | layout-timetable, layout-wayfinding, layout-strips |
| Wordmark and logo | dot-matrix, led-lab, logo |
| Other | tone-on-tone, type-specimens |

Kept on the main site: the ruled-index homepage layout, and the grid-styles,
nav-styles and bitmap prototypes (now without their airplane parts).

## Getting it back

All of these run from the repo folder.

**Look around without touching your current work.** This checks the archive out
into a separate folder next to the repo, where you can run it:

```bash
git worktree add ../portfolio-airplane archive/airplane-theme
```

```bash
cd ../portfolio-airplane && npm install && npm run dev
```

When you're done with it:

```bash
git worktree remove ../portfolio-airplane
```

**Bring one piece back** into the current site, say the passport prototype:

```bash
git checkout archive/airplane-theme -- src/app/prototypes/passport src/app/prototypes/_passport
```

Most prototypes also lean on shared components that were removed (for example
`src/components/split-flap` or `src/components/brand/led-wordmark`), so restore
those too if the type check complains.

**See everything that was removed:**

```bash
git diff archive/airplane-theme --stat
```

**Open it on GitHub:** once the tag is pushed (`git push origin archive/airplane-theme`), it's at
https://github.com/lamchop19/design-portfolio/tree/archive/airplane-theme
