import {
  Atkinson_Hyperlegible_Mono,
  Atkinson_Hyperlegible_Next,
  B612,
  Bricolage_Grotesque,
  B612_Mono,
  Bitcount_Grid_Double,
  Bitcount_Grid_Single,
  Doto,
  DotGothic16,
  Handjet,
  Instrument_Serif,
  Overpass,
  Overpass_Mono,
} from "next/font/google";

// Candidate faces for the type lab. Not preloaded: they're only fetched when
// a pairing that uses them is switched on.
const b612 = B612({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--lab-b612",
  preload: false,
});
const b612Mono = B612_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--lab-b612-mono",
  preload: false,
});
const overpass = Overpass({
  subsets: ["latin"],
  variable: "--lab-overpass",
  preload: false,
});
const overpassMono = Overpass_Mono({
  subsets: ["latin"],
  variable: "--lab-overpass-mono",
  preload: false,
});
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--lab-atkinson",
  preload: false,
});
const atkinsonMono = Atkinson_Hyperlegible_Mono({
  subsets: ["latin"],
  variable: "--lab-atkinson-mono",
  preload: false,
});
const doto = Doto({
  subsets: ["latin"],
  variable: "--lab-doto",
  preload: false,
  axes: ["ROND"],
});
// More dot-matrix candidates for the wordmark (see /prototypes/dot-matrix).
const bitcountDouble = Bitcount_Grid_Double({
  subsets: ["latin"],
  variable: "--lab-bitcount-double",
  preload: false,
  axes: ["ELSH", "ELXP"],
});
const bitcountSingle = Bitcount_Grid_Single({
  subsets: ["latin"],
  variable: "--lab-bitcount-single",
  preload: false,
  axes: ["ELSH", "ELXP"],
});
const handjet = Handjet({
  subsets: ["latin"],
  variable: "--lab-handjet",
  preload: false,
  axes: ["ELSH", "ELGR"],
});
const dotGothic = DotGothic16({
  subsets: ["latin"],
  weight: "400",
  variable: "--lab-dotgothic",
  preload: false,
});
// The live site loads Bricolage without its width axis; the stretch headings need it.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--lab-bricolage",
  preload: false,
  axes: ["wdth"],
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--lab-instrument",
  preload: false,
});

/** Every candidate's CSS variable, for the lab wrapper's className. */
export const labFontVariables = [
  b612,
  b612Mono,
  overpass,
  overpassMono,
  atkinson,
  atkinsonMono,
  doto,
  bitcountDouble,
  bitcountSingle,
  handjet,
  dotGothic,
  bricolage,
  instrument,
]
  .map((font) => font.variable)
  .join(" ");
