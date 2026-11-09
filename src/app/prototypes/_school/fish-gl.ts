/*
 * The Clash fish from the backdrop lab, drawn by one fragment shader: soft
 * egg-shaped bodies, a forked tail, a fin and an eye, over a ground. Shared
 * by the school behind the landing and the intro's dash across the mark
 * (transparent, over the intro's own dark ground).
 *
 * The grounds: three flat ones from the lab (light columns, a wash, a smear
 * of the fish colours) and three that put the viewer underwater, kept soft
 * and abstract:
 * - Shallows: just under the surface. A bright, rippling ceiling, light
 *   rays fanning down from it and caustics playing over everything near it.
 * - Open water: mid-water. Light from above fading into the deep, a few
 *   faint rays, and marine snow drifting down past in three depths.
 * - Seabed: near the bottom. Soft sand dunes in two layers, kelp ribbons
 *   swaying up out of them and bubbles rising.
 *
 * And Blank: plain white, nothing but the fish.
 *
 * Idle (no pointer for a while) the ground goes ambient: the view drifts
 * slowly and the light breathes. The TV style adds scanlines, a soft rolling
 * bar and a vignette, like a set left on a menu.
 */

export type GroundStyle = 'columns' | 'wash' | 'smear' | 'shallows' | 'open' | 'seabed' | 'blank'
export type Blend = 'multiply' | 'paint'
export type IdleStyle = 'ambient' | 'tv'
/** Follow: the school chases the pointer. Pass: it ignores the pointer and swims across now and then. */
export type Swim = 'follow' | 'pass'

export const GROUNDS: [GroundStyle, string][] = [
  ['shallows', 'Shallows'],
  ['open', 'Open water'],
  ['seabed', 'Seabed'],
  ['columns', 'Light columns'],
  ['wash', 'Wash'],
  ['smear', 'Smear'],
  ['blank', 'Blank white'],
]

export type SchoolLook = {
  /** Ground: its light colour (the surface, in the ocean grounds) and its deep. */
  ground: [string, string]
  groundStyle: GroundStyle
  /** How strong the light is: columns, rays, caustics. 0 to 1. */
  light: number
  /** How much is drifting in the water: snow, bubbles, kelp. 0 to 1. */
  particles: number
  /** Each fish blends between two of these, head to tail. */
  fish: [string, string, string]
  /** Multiply mixes overlapping fish like inks; paint lays them over each other. */
  blend: Blend
  swim: Swim
  /** Passing by: seconds between one pass leaving the screen and the next coming on. */
  passGap: number
  /** Fish on arrival. Each click adds `perClick`, up to `most`; the click after that clears them. */
  start: number
  perClick: number
  most: number
  /** Body length in screen heights. */
  size: number
  /** Top speed in screen heights per second. */
  speed: number
  /** 0 calm to 1 restless: wander, turning, how fast they circle the pointer. */
  activity: number
  /** 0 a tight ball round the pointer to 1 a loose cloud. */
  spread: number
  /** 0 crisp to 1 blurry. */
  soft: number
  /** 0 fish to 1 wobbly blobs that only hint at a fish. */
  abstract: number
  /** How different the fish are from each other: length, body depth, tail. */
  variety: number
  /** Body depth, as a fraction of length. */
  depth: number
  /** Tail size, 0 none to 1.5 large. */
  tail: number
  eyes: boolean
  /** Trails behind fast fish. */
  smear: number
  grain: number
  /** Seconds without the pointer before the scene goes idle. */
  idleAfter: number
  idleStyle: IdleStyle
  /** The paper clearing behind the type: its colour and strength (0 none, 1 full). */
  clearing: string
  clearingStrength: number
}

export const SCHOOL_LOOK: SchoolLook = {
  ground: ['#eef7fb', '#a9cbe6'],
  groundStyle: 'shallows',
  light: 0.7,
  particles: 0.6,
  fish: ['#ff5a7a', '#ffb347', '#3f6bff'],
  blend: 'paint',
  swim: 'follow',
  passGap: 5,
  start: 5,
  perClick: 1,
  most: 30,
  size: 0.028,
  speed: 0.36,
  activity: 0.35,
  spread: 0.5,
  soft: 0.3,
  abstract: 0,
  variety: 0.3,
  depth: 0.45,
  tail: 1,
  eyes: true,
  smear: 0.3,
  grain: 0.25,
  idleAfter: 4,
  idleStyle: 'ambient',
  clearing: '#ffffff',
  clearingStrength: 1,
}

/** One fish as the shader wants it. */
export type FishState = { x: number; y: number; a: number; len: number; vx: number; vy: number; phase: number; hue: number }

export const MAX_FISH = 30

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uN, uSoft, uSmear, uGrain, uLight, uParticles, uGround, uBlend, uClear;
uniform float uAbstract, uVariety, uDepth, uTail, uEyes, uIdle, uTV;
uniform vec3 uC1, uC2, uC3, uC4, uC5;
uniform vec4 uFish[${MAX_FISH}];   // x, y, heading, length
uniform vec4 uFishB[${MAX_FISH}];  // vx, vy, tail phase, colour pick

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3. - 2.*f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.03 + 17.; a *= .5; } return v/.9375; }

vec3 pick(float h){ if(h < .34) return uC3; if(h < .67) return uC4; return uC5; }

/* ---- Pieces of the ocean ---- */

/* Caustics: the net of light a rippling surface throws, from iterated warps. 0 to 1. */
float caustic(vec2 p, float t){
  vec2 q = p*5.;
  vec2 i = q;
  float c = 0.;
  for(int n=0;n<4;n++){
    float tt = t*(1. - 3.5/float(n + 1));
    i = q + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1./length(vec2(q.x/(sin(i.x + tt)/.005), q.y/(cos(i.y + tt)/.005)));
  }
  c = 1.17 - pow(c/4., 1.4);
  return clamp(pow(abs(c), 8.), 0., 1.);
}

/* Rays fanning down from a point above the frame, slowly turning. */
float rays(vec2 p, float t){
  vec2 d = p - vec2(.2*sin(t*.03), .95);
  float a = atan(d.x, -d.y);
  float r = (.5 + .5*sin(a*9. + t*.21))*(.5 + .5*sin(a*23. - t*.13 + 1.3));
  return pow(r, 3.)*smoothstep(-.75, .45, p.y);
}

/* Specks drifting through the water in three depths. dir 1 sinks (snow), -1 rises. */
float specks(vec2 p, float t, float dir, float density){
  float acc = 0.;
  for(int L=0;L<3;L++){
    float fl = float(L);
    float sc = 12. + fl*9.;
    vec2 q = p*sc + vec2(sin(t*.11 + fl*2.)*.6, t*dir*(.35 + fl*.2)) + fl*7.1;
    vec2 id = floor(q), f = fract(q);
    float h = hash(id + fl*3.);
    if(h > 1. - .2*density){
      vec2 pos = vec2(hash(id + 1.3), hash(id + 5.7))*.7 + .15;
      acc += (1. - smoothstep(0., .075 - fl*.018, length(f - pos)))*(.55 + .45*sin(t*.8 + h*20.))*(1. - fl*.28);
    }
  }
  return acc;
}

/* Bubbles: small rings rising and wobbling. */
float bubbles(vec2 p, float t, float density){
  float acc = 0.;
  for(int L=0;L<2;L++){
    float fl = float(L);
    float sc = 7. + fl*6.;
    vec2 q = p*sc + vec2(0., -t*(.9 + fl*.5)) + fl*3.3;
    vec2 id = floor(q), f = fract(q);
    float h = hash(id*1.7 + fl);
    if(h > 1. - .12*density){
      vec2 pos = vec2(.5 + .25*sin(t*2. + h*30. + q.y*1.5), .5);
      float r = .07 + .06*hash(id + 9.);
      float d = length(f - pos);
      acc += smoothstep(.025, 0., abs(d - r))*.8 + (1. - smoothstep(0., r*.5, length(f - pos - vec2(-r*.35, r*.35))))*.6;
    }
  }
  return acc;
}

vec3 ground(vec2 uv, vec2 p, float t){
  if(uGround > 5.5) return vec3(1.);   // Blank white
  // Idle, the view drifts slowly and the light breathes.
  p.x += sin(t*.045)*.07*uIdle;
  p.y += sin(t*.031)*.025*uIdle;
  float breathe = 1. + uIdle*(.35 + .25*sin(t*.4));
  vec3 surf = mix(uC1, vec3(1.), .7);
  vec3 c = mix(uC2, uC1, smoothstep(-.1, 1.1, uv.y));

  if(uGround < .5){
    // Light columns: soft vertical shafts drifting across
    float q = p.x*1.6 + t*.03;
    float s = .5 + .5*sin(q*3.1416 + .8*sin(q*1.3));
    return mix(c, surf, pow(s, 8.)*uLight*breathe);
  }
  if(uGround < 1.5) return c;
  if(uGround < 2.5){
    // Smear: soft horizontal bands of the fish colours, kept pale
    float n = fbm(vec2(p.x*.35 + t*.02, p.y*2.));
    float v = clamp(uv.y + (n - .5)*.7, 0., 1.)*4.;
    vec3 r = mix(uC2, uC1, clamp(v, 0., 1.));
    r = mix(r, uC4, clamp(v - 1., 0., 1.));
    r = mix(r, uC3, clamp(v - 2., 0., 1.));
    r = mix(r, uC5, clamp(v - 3., 0., 1.));
    return mix(r, uC1, .55);
  }

  // The ocean grounds: light from the surface above, deepening downward
  c = mix(uC2, uC1, smoothstep(-.6, .5, p.y));
  if(uGround < 3.5){
    // Shallows: a rippling bright ceiling, rays, caustics
    float sy = .43 + .012*sin(p.x*9. + t*.8) + .008*sin(p.x*23. - t*1.3);
    c = mix(c, surf, smoothstep(sy - .05, sy + .01, p.y)*.85);
    c += surf*rays(p, t)*.2*uLight*breathe;
    float near = smoothstep(-.65, .45, p.y);
    c = mix(c, surf, caustic(p*vec2(1., 1.5) + vec2(0., t*.01), t*.35)*.35*near*uLight);
    c = mix(c, surf, specks(p, t*.6, 1., uParticles)*.35);
    return c;
  }
  if(uGround < 4.5){
    // Open water: rays fading into the deep, marine snow drifting down
    c += surf*rays(p, t*.7)*.12*uLight*breathe;
    c = mix(c, surf, specks(p, t, 1., uParticles)*.6);
    return c;
  }
  // Seabed: two layers of dunes, kelp swaying out of them, bubbles rising
  c += surf*rays(p, t*.6)*.1*uLight*breathe;
  c = mix(c, surf, specks(p, t*.5, 1., uParticles*.5)*.4);
  vec3 kelp = mix(uC2, vec3(.1, .3, .28), .35);
  for(int k=0;k<7;k++){
    float fk = float(k);
    float h = hash(vec2(fk*3.7, 1.9));
    if(h > .25 + .7*(1. - uParticles)) continue;
    float x0 = (fk/6. - .5)*1.9 + (h - .5)*.25;
    float top = -.05 - .25*hash(vec2(fk, 4.2));
    float base = -.5;
    float y = clamp((p.y - base)/(top - base), 0., 1.);
    float x = x0 + .07*y*y*sin(t*.5 + fk*1.3 + p.y*3.);
    float w = mix(.03, .008, y);
    float strand = (1. - smoothstep(w*.4, w, abs(p.x - x)))*step(p.y, top)*smoothstep(-.6, -.45, p.y);
    c = mix(c, kelp, strand*.35);
  }
  vec3 sand = mix(uC1, vec3(1., .95, .86), .55);
  float far = -.32 + .03*sin(p.x*2.1 + 1.) + .015*sin(p.x*5.3);
  c = mix(c, mix(c, sand, .45), 1. - smoothstep(far - .03, far + .03, p.y));
  float nearD = -.41 + .035*sin(p.x*1.7 + 3.) + .012*sin(p.x*6.1 + 2.);
  c = mix(c, sand, 1. - smoothstep(nearD - .02, nearD + .02, p.y));
  c = mix(c, surf, bubbles(p, t, uParticles)*.5);
  return c;
}

/* One fish in its own frame: +x is the way it faces, units are its length. h is the fish's own
   random number (for its variations). d runs from the body's middle outward, for colour. */
float fishShape(vec2 q, float beat, float h, out float d, out float eye){
  float soft = mix(.05, .7, uSoft);
  float h1 = hash(vec2(h*91.7, 1.3)), h2 = hash(vec2(h*53.1, 7.9)), h3 = hash(vec2(h*17.3, 4.1));
  // Each fish's own proportions, as far apart as Variety allows
  q.x *= mix(1., .75 + .5*h3, uVariety);
  float depth = uDepth*mix(1., .6 + .8*h1, uVariety);
  float tailK = uTail*mix(1., .4 + 1.2*h2, uVariety);
  // Abstract: the outline wobbles and swims, like a painted shape
  float ab = uAbstract;
  q += ab*.35*(vec2(noise(q*1.8 + vec2(h*40., beat*.15)), noise(q*1.8 + vec2(beat*.15, h*23.))) - .5);
  q.y -= sin(beat)*.25*pow(max(.3 - q.x, 0.), 2.);
  vec2 bq = vec2(q.x, q.y/(depth*(1. + .25*clamp(q.x, -1., 1.))));
  d = length(bq);
  float body = 1. - smoothstep(1. - soft, 1., d);
  float tail = 0.;
  if(tailK > .01){
    float tx = (-q.x - .8)/tailK;
    float ay = abs(q.y)/(1. + .35*sin(beat + 1.5))/tailK;
    if(tx > -.2){
      float edge = .38 + .5*ay;
      float wide = .1 + tx*.9;
      tail = (1. - smoothstep(edge - .05 - soft*.4, edge, tx))*(1. - smoothstep(wide - .04 - soft*.3, wide, ay));
    }
  }
  vec2 fq = q - vec2(-.1, depth*.85);
  float fin = (1. - smoothstep(.2 - soft*.2, .22, length(fq*vec2(1., 1.6))))*step(0., fq.y);
  float fishA = max(max(body, tail*(1. - ab*.6)), fin*.9*(1. - ab));
  // The blob it melts into: one soft lozenge, deeper at the front
  vec2 lq = vec2((q.x + .15*tailK)/(1. + .2*tailK), q.y/(depth*1.25));
  float blob = 1. - smoothstep(1. - max(soft, .25), 1., length(lq));
  eye = uEyes*(1. - ab)*(1. - smoothstep(.07, .1 + soft*.06, length(q - vec2(.55, depth*.2))));
  return mix(fishA, blob, ab);
}

void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec2 p = (gl_FragCoord.xy - .5*uRes)/uRes.y;
  bool clear = uClear > .5;
  vec3 col = clear ? vec3(0.) : ground(uv, p, uTime);
  float alpha = clear ? 0. : 1.;
  float taps = uSmear < .01 ? 1. : 4.;
  for(int i=0;i<${MAX_FISH};i++){
    if(float(i) >= uN) break;
    vec4 f = uFish[i], g = uFishB[i];
    float r = f.w;
    if(length(p - f.xy) > r*(2.4 + uTail*.8) + length(g.xy)*uSmear*.12) continue;
    float cs = cos(f.z), sn = sin(f.z);
    float up = cs < 0. ? -1. : 1.;   // keep the fin on top whichever way it swims
    vec3 ca = pick(g.w), cb = pick(fract(g.w + .37));
    float aSum = 0.; vec3 cSum = vec3(0.);
    for(int k=0;k<4;k++){
      float fk = float(k); if(fk >= taps) break;
      vec2 at = f.xy - g.xy*fk*uSmear*.04;
      vec2 v = (p - at)/r;
      vec2 q = vec2(v.x*cs + v.y*sn, (-v.x*sn + v.y*cs)*up);
      float d, eye;
      float a = fishShape(q, g.z - fk*.3, g.w, d, eye);
      vec3 bc = mix(ca, cb, smoothstep(.1, 1., d));
      bc = mix(bc, mix(uC2, vec3(0.), .7), eye*.85);
      aSum += a; cSum += bc*a;
    }
    float a = aSum/taps*.92;
    vec3 bc = cSum/max(aSum, .001);
    if(clear){ col = col*(1. - a) + bc*a; alpha = alpha*(1. - a) + a; }   // premultiplied, over
    else if(uBlend < .5) col *= mix(vec3(1.), bc, a);
    else col = mix(col, bc, a);
  }
  if(!clear){
    // TV idle: scanlines, a soft bar rolling down, a vignette
    float tv = uIdle*uTV;
    if(tv > 0.){
      col *= 1. - tv*.08*(.5 + .5*sin(uv.y*340.*3.1416));
      col += tv*.05*exp(-pow(fract(uv.y + uTime*.05) - .5, 2.)*90.);
      col *= mix(1., smoothstep(1.35, .35, length(p*vec2(.85, 1.))), tv*.55);
    }
    col += (hash(gl_FragCoord.xy + fract(uTime*7.)*91.) - .5)*uGrain*.08;
  }
  gl_FragColor = vec4(clamp(col, 0., 1.), alpha);
}`

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/**
 * Sets a canvas up to draw fish. `transparent` draws the fish alone, for
 * laying over something else. Returns null without WebGL.
 */
export function createFishGL(canvas: HTMLCanvasElement, { transparent = false, resolution = 0.6 } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: transparent, premultipliedAlpha: true })
  if (!gl) return null

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'fish shader')
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'a')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const names = ['uRes', 'uTime', 'uN', 'uSoft', 'uSmear', 'uGrain', 'uLight', 'uParticles', 'uGround', 'uBlend', 'uClear', 'uAbstract', 'uVariety', 'uDepth', 'uTail', 'uEyes', 'uIdle', 'uTV', 'uC1', 'uC2', 'uC3', 'uC4', 'uC5', 'uFish', 'uFishB']
  const U = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)]))
  const A = new Float32Array(MAX_FISH * 4)
  const B = new Float32Array(MAX_FISH * 4)

  /** The canvas's aspect (width over height), after matching its pixels to its CSS size. */
  let aspect = 1
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2) * resolution
    canvas.width = Math.max(2, Math.round(canvas.clientWidth * scale))
    canvas.height = Math.max(2, Math.round(canvas.clientHeight * scale))
    aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()

  /** `idle` runs 0 (someone's here) to 1 (idle), eased by the caller. */
  const draw = (fish: FishState[], look: SchoolLook, t: number, idle = 0) => {
    const n = Math.min(fish.length, MAX_FISH)
    for (let i = 0; i < n; i++) {
      const f = fish[i]
      A.set([f.x, f.y, f.a, f.len], i * 4)
      B.set([f.vx, f.vy, f.phase, f.hue], i * 4)
    }
    ;[...look.ground, ...look.fish].forEach((hex, i) => gl.uniform3fv(U[`uC${i + 1}`], rgb(hex)))
    gl.uniform2f(U.uRes, canvas.width, canvas.height)
    gl.uniform1f(U.uTime, t)
    gl.uniform1f(U.uN, n)
    gl.uniform1f(U.uSoft, look.soft)
    gl.uniform1f(U.uSmear, look.smear)
    gl.uniform1f(U.uGrain, look.grain)
    gl.uniform1f(U.uLight, look.light)
    gl.uniform1f(U.uParticles, look.particles)
    gl.uniform1f(U.uGround, ['columns', 'wash', 'smear', 'shallows', 'open', 'seabed', 'blank'].indexOf(look.groundStyle))
    gl.uniform1f(U.uBlend, look.blend === 'multiply' ? 0 : 1)
    gl.uniform1f(U.uClear, transparent ? 1 : 0)
    gl.uniform1f(U.uAbstract, look.abstract)
    gl.uniform1f(U.uVariety, look.variety)
    gl.uniform1f(U.uDepth, look.depth)
    gl.uniform1f(U.uTail, look.tail)
    gl.uniform1f(U.uEyes, look.eyes ? 1 : 0)
    gl.uniform1f(U.uIdle, idle)
    gl.uniform1f(U.uTV, look.idleStyle === 'tv' ? 1 : 0)
    gl.uniform4fv(U.uFish, A)
    gl.uniform4fv(U.uFishB, B)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  return {
    resize,
    draw,
    get aspect() {
      return aspect
    },
  }
}
