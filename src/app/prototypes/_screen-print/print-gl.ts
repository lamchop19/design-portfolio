/*
 * The press. One WebGL2 canvas per print, drawing the image the way the maL
 * mark is printed: as ink on paper, from a screen of dots, specks or lamps.
 * Two numbers drive every treatment:
 *
 * - `print` (0 → 1) grows the ink from nothing to the resting print, for the
 *   print-in on load.
 * - `swell` (0 → 1) grows a second screen, cut from the full-colour image, out
 *   of the same cells until it merges: the logo's Halftone load, applied to a
 *   photo. At 1 the canvas is the plain image.
 *
 * Everything is computed per pixel in one fragment shader, so the cost is the
 * same at any pitch and a hover stays at 60fps however many prints are up.
 */

export type Treatment = 'halftone' | 'grain' | 'led' | 'twoink'

export type PrintParams = {
  treatment: Treatment
  /** Screen pitch in CSS px: the dot cell, the lamp cell, or (a quarter of it) the speck. */
  pitch: number
  ink: string
  /** The second plate's ink, for two-ink. */
  ink2: string
  paper: string
  print: number
  swell: number
  /** Reseeds the grain; changing it is the boil. */
  seed: number
}

export type Printer = {
  /** `level` sets the ink's range from the image's own darks and paper; leave it off for flat art. */
  setImage: (image: TexImageSource & { width: number; height: number }, level?: boolean) => void
  resize: (cssWidth: number, cssHeight: number) => void
  draw: (params: PrintParams) => void
  destroy: () => void
}

const VERTEX = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_res;       // canvas, device px
uniform vec2 u_scale;     // object-fit: cover, as a uv scale and offset
uniform vec2 u_shift;
uniform float u_pitch;    // device px
uniform float u_dpr;
uniform int u_mode;       // 0 halftone, 1 grain, 2 led, 3 two-ink
uniform vec3 u_paper;
uniform vec3 u_ink;
uniform vec3 u_ink2;
uniform float u_print;
uniform float u_swell;
uniform float u_seed;
uniform float u_lod;      // mip level that averages one cell
uniform vec2 u_offset;    // second plate off register, device px
uniform mat2 u_sep;       // two-ink separation: inverse of the inks' normal matrix
uniform vec3 u_k1;        // each ink's absorption (1 - ink)
uniform vec3 u_k2;
uniform float u_black;    // the image's own darks
uniform vec3 u_white;     // and its paper, per channel, however yellowed

out vec4 outColor;

const float AA = 0.8;

vec2 uvOf(vec2 p) { return u_shift + (p / u_res) * u_scale; }

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// The image levelled: its darks to black and its paper to white, so the
// paper prints clean whatever colour it has aged to.
vec3 balance(vec3 c) { return clamp((c - u_black) / max(vec3(0.05), u_white - u_black), 0.0, 1.0); }

// How much ink a colour takes, a little lighter in the midtones than linear.
float inkFor(vec3 c) { return pow(1.0 - luma(balance(c)), 1.3); }

mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, s, -s, c); }

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

// Smooth value noise, so the grain clumps the way thresholded turbulence does.
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// A round dot on a screen at angle a: returns (distance to the cell centre,
// cell centre in canvas px), both in device px.
vec4 cellOf(vec2 p, float a, float pitch) {
  vec2 q = rot(-a) * p;
  vec2 centreQ = (floor(q / pitch) + 0.5) * pitch;
  return vec4(length(q - centreQ), 0.0, rot(a) * centreQ);
}

// A dot's coverage at distance d. Tiny dots fade in rather than leave a speck
// at every centre, so bare paper stays bare.
float disc(float d, float r) { return clamp(r / AA, 0.0, 1.0) * (1.0 - smoothstep(r - AA, r + AA, d)); }

// A dot's radius for an amount of ink: area in proportion to the amount, then
// closing up into solid as it nears full, so a full tone has no paper left.
float dotR(float amount) { return u_pitch * mix(0.5642, 0.7071, smoothstep(0.72, 1.0, amount)) * sqrt(amount); }

// Ink laid on paper: multiplied, as a translucent riso ink would print.
vec3 lay(vec3 under, vec3 ink, float a) { return under * mix(vec3(1.0), ink, a); }

// Two-ink separation: how much of each plate reproduces a colour, by least
// squares on the inks' absorption.
vec2 amounts(vec3 c) {
  vec3 need = 1.0 - balance(c);
  return clamp(u_sep * vec2(dot(u_k1, need), dot(u_k2, need)), 0.0, 1.0);
}

float bayer4(vec2 c) {
  int x = int(mod(c.x, 4.0));
  int y = int(mod(c.y, 4.0));
  int i = x + y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[i]) + 0.5) / 16.0;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec3 photo = texture(u_image, uvOf(p)).rgb;
  vec3 col = u_paper;

  if (u_mode == 0) {
    // Halftone: one ink on a 45-degree screen, each dot as big as the image is dark there.
    vec4 cell = cellOf(p, radians(45.0), u_pitch);
    float dark = inkFor(textureLod(u_image, uvOf(cell.zw), u_lod).rgb);
    col = lay(col, u_ink, disc(cell.x, dotR(dark) * u_print));
    // The colour screen grows out of the same cells and merges past half the diagonal.
    float rs = u_swell * u_pitch * 0.74;
    col = mix(col, photo, u_swell > 0.999 ? 1.0 : disc(cell.x, rs));
  } else if (u_mode == 1) {
    // Grain: fine specks wherever a seeded noise falls under the darkness, the
    // way the logo's turbulence is thresholded into stipple. One CSS px at 7.
    float g = max(1.0, floor(u_dpr * u_pitch / 7.0 + 0.5));
    vec2 c = floor(p / g);
    float dark = inkFor(textureLod(u_image, uvOf((c + 0.5) * g), max(0.0, u_lod - 1.5)).rgb);
    float n = 0.55 * hash(c + u_seed) + 0.45 * vnoise(c / 2.5 + u_seed * 3.1);
    col = lay(col, u_ink, step(n, dark * u_print));
    // The colour comes through speck by speck, from a second hash. A few specks
    // never do, so the grain still boils over the finished picture.
    float h2 = hash(c * 1.37 + 17.0 + u_seed * 0.61);
    col = mix(col, photo, step(h2, u_swell * 0.93));
  } else if (u_mode == 2) {
    // LED: square lamps on a level grid, a little coarser than the dots, each
    // at one of five brightnesses dithered between, with the unlit lamps just
    // visible, like the dotted name under the monogram. They light at random
    // as it prints in.
    float lp = u_pitch * 1.25;
    vec2 c = floor(p / lp);
    vec2 local = p - (c + 0.5) * lp;
    vec3 cellCol = textureLod(u_image, uvOf((c + 0.5) * lp), u_lod + 0.3).rgb;
    float dark = inkFor(cellCol);
    // Lamps run brighter than ink, so a midtone lights most of the way.
    float lit = floor(smoothstep(0.05, 0.7, dark) * 4.0 + bayer4(c)) / 4.0 * step(hash(c), u_print);
    float half_ = mix(0.36, 0.52, u_swell) * lp;
    vec2 b = abs(local) - vec2(half_ - lp * 0.1);
    float box = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - lp * 0.1;
    float lamp = 1.0 - smoothstep(-AA, AA, box);
    // Pointed at, every lamp lights in the image's own colour, then the picture sharpens.
    float on = mix(max(lit, 0.06 * u_print), 1.0, smoothstep(0.0, 0.55, u_swell));
    vec3 lampInk = mix(u_ink, cellCol, smoothstep(0.0, 0.55, u_swell));
    col = mix(col, col * lampInk, lamp * on);
    col = mix(col, photo, smoothstep(0.62, 1.0, u_swell));
  } else {
    // Two-ink: two plates on their own screens, the second off register. They
    // come into register as the colour arrives.
    vec4 c1 = cellOf(p, radians(15.0), u_pitch);
    float a1 = amounts(textureLod(u_image, uvOf(c1.zw), u_lod).rgb).x;
    vec2 p2 = p - u_offset * (1.0 - u_swell);
    vec4 c2 = cellOf(p2, radians(75.0), u_pitch);
    float a2 = amounts(textureLod(u_image, uvOf(c2.zw), u_lod).rgb).y;
    col = lay(col, u_ink, disc(c1.x, dotR(a1) * u_print));
    col = lay(col, u_ink2, disc(c2.x, dotR(a2) * u_print));
    float rs = u_swell * u_pitch * 0.74;
    col = mix(col, photo, u_swell > 0.999 ? 1.0 : disc(c1.x, rs));
  }

  outColor = vec4(col, 1.0);
}
`

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join('') : h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/**
 * The two-ink separation's 2 × 2 matrix: the inverse of [k1·k1 k1·k2; k1·k2 k2·k2],
 * so the shader can solve for both plates with one multiply. Returned column-major.
 */
function separation(k1: number[], k2: number[]): number[] {
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const a = dot(k1, k1)
  const b = dot(k1, k2)
  const d = dot(k2, k2)
  const det = a * d - b * b || 1e-4
  return [d / det, -b / det, -b / det, a / det]
}

const MODES: Record<Treatment, number> = { halftone: 0, grain: 1, led: 2, twoink: 3 }

type Levels = { black: number; white: [number, number, number] }

/** Flat art prints as it is: no levelling. */
const FLAT: Levels = { black: 0, white: [0.95, 0.95, 0.95] }

/**
 * An image's darks and its paper, from a thumbnail: black is half the 2nd
 * percentile of luminance (so a pale image isn't forced to solid ink), white
 * a little under each channel's 90th percentile (old plates are mostly
 * paper, and yellowed). An image with little range prints as it is.
 */
function levelsOf(source: CanvasImageSource): Levels {
  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 60
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return FLAT
  ctx.drawImage(source, 0, 0, 48, 60)
  const data = ctx.getImageData(0, 0, 48, 60).data
  const channels: number[][] = [[], [], [], []]
  for (let i = 0; i < data.length; i += 4) {
    for (let k = 0; k < 3; k++) channels[k].push(data[i + k] / 255)
    channels[3].push((0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255)
  }
  const at = (values: number[], q: number) => values.sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(q * values.length))]
  const black = at(channels[3], 0.02) / 2
  const white = [0, 1, 2].map((k) => at(channels[k], 0.9) - 0.03) as Levels['white']
  return Math.min(...white) - black < 0.25 ? FLAT : { black, white }
}

/** Sets up the press on a canvas, or returns null where WebGL2 isn't available (the caller shows the plain image). */
export function createPrinter(canvas: HTMLCanvasElement): Printer | null {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false })
  if (!gl) return null

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader failed')
    return shader
  }
  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed')
  gl.useProgram(program)

  // One triangle that covers the canvas.
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  const u = (name: string) => gl.getUniformLocation(program, name)
  const loc = {
    res: u('u_res'),
    scale: u('u_scale'),
    shift: u('u_shift'),
    pitch: u('u_pitch'),
    dpr: u('u_dpr'),
    mode: u('u_mode'),
    paper: u('u_paper'),
    ink: u('u_ink'),
    ink2: u('u_ink2'),
    print: u('u_print'),
    swell: u('u_swell'),
    seed: u('u_seed'),
    lod: u('u_lod'),
    black: u('u_black'),
    white: u('u_white'),
    offset: u('u_offset'),
    sep: u('u_sep'),
    k1: u('u_k1'),
    k2: u('u_k2'),
  }

  let image: { width: number; height: number } | null = null
  let levels = FLAT
  let dpr = 1

  return {
    setImage(source, level = true) {
      image = { width: source.width, height: source.height }
      levels = level ? levelsOf(source as CanvasImageSource) : FLAT
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      gl.generateMipmap(gl.TEXTURE_2D)
    },

    resize(cssWidth, cssHeight) {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(cssWidth * dpr))
      const height = Math.max(1, Math.round(cssHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    },

    draw(params) {
      const { width, height } = canvas
      gl.viewport(0, 0, width, height)
      if (!image) {
        // A bare sheet until the image lands, never the context's black.
        const [r, g, b] = rgb(params.paper)
        gl.clearColor(r, g, b, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        return
      }

      // object-fit: cover, centred.
      const canvasAspect = width / height
      const imageAspect = image.width / image.height
      const sx = canvasAspect > imageAspect ? 1 : canvasAspect / imageAspect
      const sy = canvasAspect > imageAspect ? imageAspect / canvasAspect : 1
      const pitch = params.pitch * dpr
      // The mip level whose texels are about one cell wide, so a dot reads its cell's average.
      const texelsPerCell = ((image.width * sx) / width) * pitch
      const k1 = rgb(params.ink).map((c) => 1 - c)
      const k2 = rgb(params.ink2).map((c) => 1 - c)

      gl.uniform2f(loc.res, width, height)
      gl.uniform2f(loc.scale, sx, sy)
      gl.uniform2f(loc.shift, (1 - sx) / 2, (1 - sy) / 2)
      gl.uniform1f(loc.pitch, pitch)
      gl.uniform1f(loc.dpr, dpr)
      gl.uniform1i(loc.mode, MODES[params.treatment])
      gl.uniform3fv(loc.paper, rgb(params.paper))
      gl.uniform3fv(loc.ink, rgb(params.ink))
      gl.uniform3fv(loc.ink2, rgb(params.ink2))
      gl.uniform1f(loc.print, params.print)
      gl.uniform1f(loc.swell, params.swell)
      gl.uniform1f(loc.seed, params.seed)
      gl.uniform1f(loc.lod, Math.max(0, Math.log2(Math.max(1, texelsPerCell)) - 0.4))
      gl.uniform1f(loc.black, levels.black)
      gl.uniform3fv(loc.white, levels.white)
      // The second plate sits a little right and down, as the title hover's orange does.
      gl.uniform2f(loc.offset, 2.2 * dpr, 1.6 * dpr)
      gl.uniformMatrix2fv(loc.sep, false, separation(k1, k2))
      gl.uniform3fv(loc.k1, k1)
      gl.uniform3fv(loc.k2, k2)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },

    destroy() {
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      // Hand the context back now rather than at garbage collection: browsers cap live contexts.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
