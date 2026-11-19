/**
 * Color maths for the picker. No dependencies.
 *
 * The picker's canonical model is HSL: { h: 0–360, s: 0–100, l: 0–100, a: 0–1 }.
 * Every other format is derived from it on demand, and parseColor() brings
 * anything the user pastes back into HSL. Covered by color.test.js.
 */
import { NAMED_COLORS } from './colorNames.js'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
const wrapHue = h => ((h % 360) + 360) % 360
const finite = (v, fallback) => (Number.isFinite(v) ? v : fallback)
const toByte = n => clamp(Math.round(n), 0, 255)

const round = (n, digits = 0) => {
  const p = 10 ** digits
  return Math.round((n + Number.EPSILON) * p) / p
}
/** Rounds and prints without trailing zeros ("12.5", "3", never "-0"). */
const fmt = (n, digits = 0) => String(round(n, digits) + 0)

const RAD = Math.PI / 180

/** Clamps and rounds an HSL(A) object so it is always safe to store and render. */
export function normalizeHsl(input) {
  const { h = 0, s = 0, l = 0, a = 1 } = input ?? {}
  return {
    h: round(clamp(finite(+h, 0), 0, 360), 2),
    s: round(clamp(finite(+s, 0), 0, 100), 2),
    l: round(clamp(finite(+l, 0), 0, 100), 2),
    a: round(clamp(finite(+a, 1), 0, 1), 3)
  }
}

/* ------------------------------------------------------------------ */
/* sRGB family: HSL, HSV, HWB, CMYK                                    */
/* ------------------------------------------------------------------ */

/** HSL → RGB, channels as floats 0–255. */
export function hslToRgb({ h, s, l }) {
  const S = s / 100
  const L = l / 100
  const a = S * Math.min(L, 1 - L)
  const channel = (n) => {
    const k = (n + wrapHue(h) / 30) % 12
    return (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255
  }
  return { r: channel(0), g: channel(8), b: channel(4) }
}

function hueOf(R, G, B, max, d) {
  let h
  if (max === R) h = ((G - B) / d) % 6
  else if (max === G) h = (B - R) / d + 2
  else h = (R - G) / d + 4
  h *= 60
  return h < 0 ? h + 360 : h
}

/** RGB (0–255) → HSL. */
export function rgbToHsl({ r, g, b }) {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const d = max - min
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    h = hueOf(R, G, B, max, d)
  }
  return { h, s: s * 100, l: l * 100 }
}

export function rgbToHsv({ r, g, b }) {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const d = max - min
  return { h: d === 0 ? 0 : hueOf(R, G, B, max, d), s: max === 0 ? 0 : (d / max) * 100, v: max * 100 }
}

export function rgbToHwb({ r, g, b }) {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const d = max - min
  return { h: d === 0 ? 0 : hueOf(R, G, B, max, d), w: min * 100, b: (1 - max) * 100 }
}

function hwbToRgb({ h, w, b }) {
  const W = w / 100
  const Bk = b / 100
  if (W + Bk >= 1) {
    const gray = (W / (W + Bk)) * 255
    return { r: gray, g: gray, b: gray }
  }
  const base = hslToRgb({ h, s: 100, l: 50 })
  const k = 1 - W - Bk
  return { r: base.r * k + W * 255, g: base.g * k + W * 255, b: base.b * k + W * 255 }
}

export function rgbToCmyk({ r, g, b }) {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const k = 1 - Math.max(R, G, B)
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: ((1 - R - k) / (1 - k)) * 100,
    m: ((1 - G - k) / (1 - k)) * 100,
    y: ((1 - B - k) / (1 - k)) * 100,
    k: k * 100
  }
}

/* ------------------------------------------------------------------ */
/* Perceptual spaces: OKLab/OKLCH and CIE Lab/LCH (D50, as in CSS)     */
/* ------------------------------------------------------------------ */

const toLinear = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const fromLinear = v => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255

// Björn Ottosson's OKLab matrices.
export function rgbToOklab({ r, g, b }) {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  }
}

export function oklabToRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  }
}

const toPolar = (a, b, grayBelow) => {
  const C = Math.hypot(a, b)
  return { C, h: C < grayBelow ? 0 : wrapHue(Math.atan2(b, a) / RAD) }
}
const fromPolar = (C, h) => ({ a: C * Math.cos(h * RAD), b: C * Math.sin(h * RAD) })

export function rgbToOklch(rgb) {
  const { L, a, b } = rgbToOklab(rgb)
  return { L, ...toPolar(a, b, 0.002) }
}
export function oklchToRgb({ L, C, h }) {
  return oklabToRgb({ L, ...fromPolar(C, h) })
}

const D50 = [0.96422, 1, 0.82521]
const EPSILON = 216 / 24389
const KAPPA = 24389 / 27

export function rgbToLab({ r, g, b }) {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  // sRGB (D65) → XYZ (D65)
  const X = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
  const Y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb
  const Z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb
  // Bradford adaptation to D50
  const xyz = [
    1.0478112 * X + 0.0228866 * Y - 0.050127 * Z,
    0.0295424 * X + 0.9904844 * Y - 0.0170491 * Z,
    -0.0092345 * X + 0.0150436 * Y + 0.7521316 * Z
  ]
  const [fx, fy, fz] = xyz.map((v, i) => {
    const t = v / D50[i]
    return t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116
  })
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

export function labToRgb({ L, a, b }) {
  const fy = (L + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200
  const cube = t => (t ** 3 > EPSILON ? t ** 3 : (116 * t - 16) / KAPPA)
  const x50 = cube(fx) * D50[0]
  const y50 = L > KAPPA * EPSILON ? fy ** 3 : L / KAPPA
  const z50 = cube(fz) * D50[2]
  // Bradford back to D65, then XYZ → linear sRGB
  const X = 0.9555766 * x50 - 0.0230393 * y50 + 0.0631636 * z50
  const Y = -0.0282895 * x50 + 1.0099416 * y50 + 0.0210077 * z50
  const Z = 0.0122982 * x50 - 0.020483 * y50 + 1.3299098 * z50
  return {
    r: fromLinear(3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z),
    g: fromLinear(-0.969266 * X + 1.8760108 * Y + 0.041556 * Z),
    b: fromLinear(0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z)
  }
}

export function rgbToLch(rgb) {
  const { L, a, b } = rgbToLab(rgb)
  return { L, ...toPolar(a, b, 0.5) }
}
export function lchToRgb({ L, C, h }) {
  return labToRgb({ L, ...fromPolar(C, h) })
}

const clampRgb = ({ r, g, b }) => ({ r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) })
const inGamut = ({ r, g, b }) => [r, g, b].every(v => v > -0.5 && v < 255.5)

/** OKLCH → sRGB, lowering chroma until the color fits so the hue doesn't shift. */
function oklchToRgbInGamut({ L, C, h }) {
  let chroma = C
  for (let i = 0; i < 60; i++) {
    const rgb = oklchToRgb({ L, C: chroma, h })
    if (inGamut(rgb)) return clampRgb(rgb)
    chroma *= 0.95
  }
  return clampRgb(oklchToRgb({ L, C: 0, h }))
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** Hex string. Includes an alpha byte only when alpha is below 1. */
export function toHex(color) {
  const c = normalizeHsl(color)
  const { r, g, b } = hslToRgb(c)
  const hex = v => toByte(v).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}${c.a < 1 ? hex(c.a * 255) : ''}`
}

/** hsla() string for painting backgrounds. */
export function toHsla(color) {
  const { h, s, l, a } = normalizeHsl(color)
  return `hsla(${h}, ${s}%, ${l}%, ${a})`
}

/**
 * The formats shown in the picker. `css: false` means the string isn't valid CSS
 * (it's a notation designers use), so the UI flags it.
 */
export const FORMATS = [
  { id: 'hex', label: 'HEX', css: true },
  { id: 'rgb', label: 'RGB', css: true },
  { id: 'hsl', label: 'HSL', css: true },
  { id: 'hwb', label: 'HWB', css: true },
  { id: 'oklch', label: 'OKLCH', css: true },
  { id: 'oklab', label: 'OKLab', css: true },
  { id: 'lch', label: 'LCH', css: true },
  { id: 'lab', label: 'Lab', css: true },
  { id: 'hsv', label: 'HSV', css: false },
  { id: 'cmyk', label: 'CMYK', css: false }
]

/**
 * Formats a color. Options:
 *  - legacy: use comma syntax (`rgba(30, 123, 255, 0.5)`) instead of `rgb(30 123 255 / 0.5)`.
 */
export function formatColor(color, format = 'hex', { legacy = false } = {}) {
  const c = normalizeHsl(color)
  const rgb = hslToRgb(c)
  const hasAlpha = c.a < 1
  const A = fmt(c.a, 3)
  const slash = hasAlpha ? ` / ${A}` : ''

  switch (format) {
    case 'hex':
      return toHex(c)
    case 'rgb': {
      const [R, G, B] = [rgb.r, rgb.g, rgb.b].map(toByte)
      if (legacy) return hasAlpha ? `rgba(${R}, ${G}, ${B}, ${A})` : `rgb(${R}, ${G}, ${B})`
      return `rgb(${R} ${G} ${B}${slash})`
    }
    case 'hsl': {
      const [H, S, L] = [fmt(c.h), fmt(c.s), fmt(c.l)]
      if (legacy) return hasAlpha ? `hsla(${H}, ${S}%, ${L}%, ${A})` : `hsl(${H}, ${S}%, ${L}%)`
      return `hsl(${H} ${S}% ${L}%${slash})`
    }
    case 'hwb': {
      const v = rgbToHwb(rgb)
      return `hwb(${fmt(v.h)} ${fmt(v.w)}% ${fmt(v.b)}%${slash})`
    }
    case 'hsv': {
      const v = rgbToHsv(rgb)
      return `hsv(${fmt(v.h)}, ${fmt(v.s)}%, ${fmt(v.v)}%)`
    }
    case 'cmyk': {
      const v = rgbToCmyk(rgb)
      return `cmyk(${fmt(v.c)}%, ${fmt(v.m)}%, ${fmt(v.y)}%, ${fmt(v.k)}%)`
    }
    case 'oklch': {
      const v = rgbToOklch(rgb)
      return `oklch(${fmt(v.L * 100, 1)}% ${fmt(v.C, 3)} ${fmt(v.h, 1)}${slash})`
    }
    case 'oklab': {
      const v = rgbToOklab(rgb)
      return `oklab(${fmt(v.L * 100, 1)}% ${fmt(v.a, 3)} ${fmt(v.b, 3)}${slash})`
    }
    case 'lch': {
      const v = rgbToLch(rgb)
      return `lch(${fmt(v.L, 1)}% ${fmt(v.C, 1)} ${fmt(v.h, 1)}${slash})`
    }
    case 'lab': {
      const v = rgbToLab(rgb)
      return `lab(${fmt(v.L, 1)}% ${fmt(v.a, 1)} ${fmt(v.b, 1)}${slash})`
    }
    default:
      return toHex(c)
  }
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function hexToRgba(hex) {
  let h = hex.replace('#', '')
  if (h.length <= 4) h = [...h].map(ch => ch + ch).join('')
  const byte = i => parseInt(h.slice(i, i + 2), 16)
  return { r: byte(0), g: byte(2), b: byte(4), a: h.length === 8 ? round(byte(6) / 255, 3) : 1 }
}

const fromRgb = (rgb, a = 1) => normalizeHsl({ ...rgbToHsl(clampRgb(rgb)), a })

const NUMBER = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|turn|rad|grad)?$/

/** "50%" → { v: 50, unit: '%' }. `none` counts as 0, as in CSS. */
function token(t) {
  if (t === 'none') return { v: 0, unit: '' }
  const m = NUMBER.exec(t)
  return m ? { v: parseFloat(m[1]), unit: m[2] || '' } : null
}

function hueDegrees({ v, unit }) {
  if (unit === 'turn') return v * 360
  if (unit === 'rad') return v / RAD
  if (unit === 'grad') return v * 0.9
  return v
}

function alphaValue(raw) {
  if (raw === undefined) return 1
  const t = token(raw)
  if (!t) return NaN
  return clamp(t.unit === '%' ? t.v / 100 : t.v, 0, 1)
}

function parseFunction(str) {
  const m = /^([a-z]+)\((.*)\)$/.exec(str)
  if (!m) return null
  const [body, slash] = m[2].split('/')
  const parts = body.trim().split(/[\s,]+/).filter(Boolean)
  let alpha = slash?.trim()
  // Legacy syntax puts alpha in a fourth comma-separated slot: rgba(30, 123, 255, 0.5)
  if (alpha === undefined && parts.length === 4) alpha = parts.pop()
  return { name: m[1], parts, alpha }
}

/**
 * Parses any color a person is likely to paste: hex (3/4/6/8 digits, # optional),
 * rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch() in modern or legacy syntax,
 * and CSS color names. Returns a normalized HSL object, or null.
 */
export function parseColor(input) {
  if (typeof input !== 'string') return null
  const str = input.trim().toLowerCase()
  if (!str) return null

  if (str === 'transparent') return normalizeHsl({ h: 0, s: 0, l: 0, a: 0 })
  if (Object.prototype.hasOwnProperty.call(NAMED_COLORS, str)) return fromRgb(hexToRgba(NAMED_COLORS[str]))

  const bare = str.startsWith('#') ? str.slice(1) : str
  if (/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(bare)) {
    const { a, ...rgb } = hexToRgba(bare)
    return fromRgb(rgb, a)
  }

  const fn = parseFunction(str)
  if (!fn || fn.parts.length !== 3) return null
  const t = fn.parts.map(token)
  if (t.some(x => !x)) return null
  const a = alphaValue(fn.alpha)
  if (Number.isNaN(a)) return null
  const [p1, p2, p3] = t

  switch (fn.name) {
    case 'rgb':
    case 'rgba': {
      const [r, g, b] = t.map(x => (x.unit === '%' ? x.v * 2.55 : x.v))
      return fromRgb({ r, g, b }, a)
    }
    case 'hsl':
    case 'hsla':
      return normalizeHsl({ h: wrapHue(hueDegrees(p1)), s: p2.v, l: p3.v, a })
    case 'hwb':
      return fromRgb(hwbToRgb({ h: wrapHue(hueDegrees(p1)), w: p2.v, b: p3.v }), a)
    case 'oklab': {
      const scale = x => (x.unit === '%' ? (x.v / 100) * 0.4 : x.v)
      return fromRgb(oklabToRgb({ L: p1.unit === '%' ? p1.v / 100 : p1.v, a: scale(p2), b: scale(p3) }), a)
    }
    case 'oklch':
      return fromRgb(
        oklchToRgb({ L: p1.unit === '%' ? p1.v / 100 : p1.v, C: p2.unit === '%' ? (p2.v / 100) * 0.4 : p2.v, h: hueDegrees(p3) }),
        a
      )
    case 'lab':
      return fromRgb(labToRgb({ L: p1.v, a: p2.v, b: p3.v }), a)
    case 'lch':
      return fromRgb(lchToRgb({ L: p1.v, C: p2.v, h: hueDegrees(p3) }), a)
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* Names                                                               */
/* ------------------------------------------------------------------ */

let namedIndex
/** Closest CSS color name by OKLab distance. `exact` is true when the bytes match. */
export function nearestName(rgb) {
  namedIndex ??= Object.entries(NAMED_COLORS)
    .filter(([name]) => !name.includes('grey')) // every "grey" has a "gray" twin
    .map(([name, hex]) => {
      const { a, ...bytes } = hexToRgba(hex)
      return { name, hex, bytes, lab: rgbToOklab(bytes) }
    })
  const target = rgbToOklab(rgb)
  let best = namedIndex[0]
  let bestDistance = Infinity
  for (const entry of namedIndex) {
    const d = (entry.lab.L - target.L) ** 2 + (entry.lab.a - target.a) ** 2 + (entry.lab.b - target.b) ** 2
    if (d < bestDistance) {
      best = entry
      bestDistance = d
    }
  }
  const exact = toByte(rgb.r) === best.bytes.r && toByte(rgb.g) === best.bytes.g && toByte(rgb.b) === best.bytes.b
  return { name: best.name, hex: best.hex, exact }
}

/* ------------------------------------------------------------------ */
/* Contrast (WCAG 2.x)                                                 */
/* ------------------------------------------------------------------ */

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }
export { WHITE, BLACK }

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * toLinear(toByte(r)) + 0.7152 * toLinear(toByte(g)) + 0.0722 * toLinear(toByte(b))
}

export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Ratio plus the four WCAG thresholds. `shown` is floored, as WCAG requires (4.499 is not 4.5). */
export function contrastReport(a, b) {
  const ratio = contrastRatio(a, b)
  return {
    ratio,
    shown: Math.floor(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7
  }
}

/** '#fff' or '#000', whichever reads better on top of the color. */
export function readableInk(color) {
  const rgb = hslToRgb(normalizeHsl(color))
  return contrastRatio(rgb, WHITE) >= contrastRatio(rgb, BLACK) ? '#fff' : '#000'
}

/* ------------------------------------------------------------------ */
/* Harmonies, shade scale, random                                      */
/* ------------------------------------------------------------------ */

export const HARMONIES = [
  { id: 'complementary', label: 'Complementary', offsets: [0, 180] },
  { id: 'analogous', label: 'Analogous', offsets: [-30, 0, 30] },
  { id: 'triadic', label: 'Triadic', offsets: [0, 120, 240] },
  { id: 'split', label: 'Split complementary', offsets: [0, 150, 210] },
  { id: 'tetradic', label: 'Tetradic', offsets: [0, 90, 180, 270] }
]

/** Rotates the hue and keeps saturation, lightness and alpha. */
export function harmony(color, id) {
  const scheme = HARMONIES.find(s => s.id === id)
  const base = normalizeHsl(color)
  return scheme.offsets.map(deg => normalizeHsl({ ...base, h: wrapHue(base.h + deg) }))
}

const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const SCALE_LIGHTNESS = [0.97, 0.93, 0.86, 0.77, 0.68, 0.6, 0.52, 0.44, 0.36, 0.28, 0.2]

/**
 * An 11-step scale (50–950) with the same hue and chroma, spaced evenly in OKLCH
 * lightness. The step closest to the base color's lightness is the base color itself.
 */
export function shadeScale(color) {
  const base = normalizeHsl(color)
  const { L, C, h } = rgbToOklch(hslToRgb(base))
  let baseIndex = 0
  SCALE_LIGHTNESS.forEach((target, i) => {
    if (Math.abs(target - L) < Math.abs(SCALE_LIGHTNESS[baseIndex] - L)) baseIndex = i
  })
  return SCALE_STEPS.map((step, i) => {
    const isBase = i === baseIndex
    const hsl = isBase ? base : normalizeHsl({ ...rgbToHsl(oklchToRgbInGamut({ L: SCALE_LIGHTNESS[i], C, h })), a: base.a })
    return { step, color: hsl, isBase }
  })
}

/** A pleasant random color: any hue, but never muddy or neon. */
export function randomColor() {
  const between = (min, max) => Math.round(min + Math.random() * (max - min))
  return normalizeHsl({ h: between(0, 360), s: between(45, 95), l: between(35, 70), a: 1 })
}
