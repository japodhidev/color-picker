import { describe, expect, it } from 'vitest'
import {
  FORMATS,
  HARMONIES,
  contrastRatio,
  formatColor,
  harmony,
  hslToRgb,
  nearestName,
  normalizeHsl,
  parseColor,
  readableInk,
  rgbToHsl,
  rgbToLab,
  rgbToOklch,
  shadeScale,
  toHex,
} from './color'

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }
const RED = { h: 0, s: 100, l: 50, a: 1 }

describe('HSL ⇄ RGB', () => {
  it('converts the primaries', () => {
    expect(toHex({ h: 0, s: 100, l: 50 })).toBe('#ff0000')
    expect(toHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00')
    expect(toHex({ h: 240, s: 100, l: 50 })).toBe('#0000ff')
    expect(toHex({ h: 0, s: 0, l: 100 })).toBe('#ffffff')
    expect(toHex({ h: 0, s: 0, l: 0 })).toBe('#000000')
  })

  it('round-trips every 5th byte combination without drifting', () => {
    for (let r = 0; r < 256; r += 5) {
      for (let g = 0; g < 256; g += 5) {
        for (let b = 0; b < 256; b += 15) {
          const hsl = normalizeHsl(rgbToHsl({ r, g, b }))
          const back = hslToRgb(hsl)
          expect([Math.round(back.r), Math.round(back.g), Math.round(back.b)]).toEqual([r, g, b])
        }
      }
    }
  })
})

describe('normalizeHsl', () => {
  it('clamps, rounds and tolerates garbage', () => {
    expect(normalizeHsl({ h: 400, s: -5, l: 50.123, a: 2 })).toEqual({ h: 360, s: 0, l: 50.12, a: 1 })
    expect(normalizeHsl(null)).toEqual({ h: 0, s: 0, l: 0, a: 1 })
    expect(normalizeHsl({ h: 'banana' })).toEqual({ h: 0, s: 0, l: 0, a: 1 })
  })
})

describe('formatColor', () => {
  const blue = { h: 212, s: 100, l: 50, a: 1 }

  it('formats the default HSL in modern and legacy syntax', () => {
    expect(formatColor(blue, 'hsl')).toBe('hsl(212 100% 50%)')
    expect(formatColor(blue, 'hsl', { legacy: true })).toBe('hsl(212, 100%, 50%)')
  })

  it('adds alpha in each syntax', () => {
    const c = { ...blue, a: 0.5 }
    expect(formatColor(c, 'hsl')).toBe('hsl(212 100% 50% / 0.5)')
    expect(formatColor(c, 'hsl', { legacy: true })).toBe('hsla(212, 100%, 50%, 0.5)')
    expect(formatColor(c, 'rgb', { legacy: true })).toBe('rgba(0, 119, 255, 0.5)')
    expect(formatColor(c, 'hex')).toBe('#0077ff80')
  })

  it('matches published reference values for red', () => {
    expect(formatColor(RED, 'rgb')).toBe('rgb(255 0 0)')
    expect(formatColor(RED, 'hwb')).toBe('hwb(0 0% 0%)')
    expect(formatColor(RED, 'hsv')).toBe('hsv(0, 100%, 100%)')
    expect(formatColor(RED, 'cmyk')).toBe('cmyk(0%, 100%, 100%, 0%)')
    const ok = rgbToOklch({ r: 255, g: 0, b: 0 })
    expect(ok.L).toBeCloseTo(0.628, 3)
    expect(ok.C).toBeCloseTo(0.2577, 3)
    expect(ok.h).toBeCloseTo(29.23, 1)
    const lab = rgbToLab({ r: 255, g: 0, b: 0 })
    expect(lab.L).toBeCloseTo(54.29, 1)
    expect(lab.a).toBeCloseTo(80.8, 0)
    expect(lab.b).toBeCloseTo(69.89, 0)
  })

  it('maps black, white and grays to zero chroma', () => {
    expect(formatColor({ h: 0, s: 0, l: 100, a: 1 }, 'lab')).toBe('lab(100% 0 0)')
    expect(formatColor({ h: 0, s: 0, l: 0, a: 1 }, 'cmyk')).toBe('cmyk(0%, 0%, 0%, 100%)')
    expect(formatColor({ h: 0, s: 0, l: 50, a: 1 }, 'oklch')).toMatch(/^oklch\(59\.8% 0 0\)$/)
  })

  it('never prints -0', () => {
    for (const { id } of FORMATS) expect(formatColor({ h: 0, s: 0, l: 50, a: 1 }, id)).not.toContain('-0')
  })
})

describe('parseColor', () => {
  const sameColor = (input, expectedHex) => {
    const parsed = parseColor(input)
    expect(parsed, input).not.toBeNull()
    expect(toHex(parsed), input).toBe(expectedHex)
  }

  it('reads hex in every length, with or without #', () => {
    sameColor('#1E7BFF', '#1e7bff')
    sameColor('1e7bff', '#1e7bff')
    sameColor('#fff', '#ffffff')
    sameColor('#f00a', '#ff0000aa')
    sameColor('#1e7bff80', '#1e7bff80')
  })

  it('reads rgb() in modern, legacy and percent syntax', () => {
    sameColor('rgb(30 123 255)', '#1e7bff')
    sameColor('rgb(30, 123, 255)', '#1e7bff')
    sameColor('rgba(30, 123, 255, 0.5)', '#1e7bff80')
    sameColor('rgb(30 123 255 / 50%)', '#1e7bff80')
    sameColor('rgb(100% 0% 0%)', '#ff0000')
  })

  it('reads hsl() and hwb()', () => {
    sameColor('hsl(0, 100%, 50%)', '#ff0000')
    sameColor('hsl(0deg 100% 50% / 1)', '#ff0000')
    sameColor('hsl(0.5turn 100% 50%)', '#00ffff')
    sameColor('hwb(0 0% 0%)', '#ff0000')
    sameColor('hwb(0 50% 50%)', '#808080')
  })

  it('reads perceptual spaces', () => {
    sameColor('oklch(62.8% 0.2577 29.23)', '#ff0000')
    sameColor('lab(54.29% 80.8 69.89)', '#ff0000')
    sameColor('lch(54.29% 106.84 40.85)', '#ff0000')
  })

  it('reads names, case-insensitively', () => {
    sameColor('cornflowerblue', '#6495ed')
    sameColor('  RebeccaPurple ', '#663399')
  })

  it('rejects things that are not colors', () => {
    for (const bad of ['', '   ', 'blue-ish', '#12', '#12345', 'rgb(1 2)', 'hsl(a b c)', 'constructor', null, 42]) {
      expect(parseColor(bad), String(bad)).toBeNull()
    }
  })

  it('round-trips every CSS format back to the same color', () => {
    // Formats that print rounded numbers can drift by a byte or two when pasted back; hex and rgb are exact.
    const lossy = { hsl: 2, hwb: 2, oklch: 1, oklab: 1, lch: 1, lab: 1 }
    const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    const samples = ['#1e7bff', '#ff8800', '#102030', '#c0ffee', '#808080', '#ffffff', '#000000']
    for (const hex of samples) {
      const color = parseColor(hex)
      for (const { id } of FORMATS) {
        if (id === 'hsv' || id === 'cmyk') continue
        const back = channels(toHex(parseColor(formatColor(color, id))))
        const want = channels(hex)
        back.forEach((v, i) => expect(Math.abs(v - want[i]), `${hex} via ${id}`).toBeLessThanOrEqual(lossy[id] ?? 0))
      }
    }
  })
})

describe('names', () => {
  it('finds exact and approximate names', () => {
    expect(nearestName({ r: 100, g: 149, b: 237 })).toMatchObject({ name: 'cornflowerblue', exact: true })
    const near = nearestName({ r: 101, g: 150, b: 238 })
    expect(near.name).toBe('cornflowerblue')
    expect(near.exact).toBe(false)
  })
})

describe('contrast', () => {
  it('matches the WCAG extremes', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5)
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5)
  })

  it('picks readable ink', () => {
    expect(readableInk({ h: 60, s: 100, l: 50 })).toBe('#000')
    expect(readableInk({ h: 240, s: 100, l: 30 })).toBe('#fff')
  })
})

describe('harmonies and scale', () => {
  it('rotates hue and wraps around 360', () => {
    const [base, opposite] = harmony({ h: 212, s: 80, l: 40, a: 1 }, 'complementary')
    expect(base.h).toBe(212)
    expect(opposite.h).toBe(32)
    expect(harmony({ h: 10, s: 80, l: 40 }, 'analogous').map((c) => c.h)).toEqual([340, 10, 40])
  })

  it('builds every scheme with the right number of colors', () => {
    for (const { id, offsets } of HARMONIES) expect(harmony(RED, id)).toHaveLength(offsets.length)
  })

  it('builds an 11-step scale that gets darker and contains the base once', () => {
    const base = { h: 212, s: 90, l: 55, a: 1 }
    const scale = shadeScale(base)
    expect(scale).toHaveLength(11)
    expect(scale.filter((s) => s.isBase)).toHaveLength(1)
    expect(scale.find((s) => s.isBase).color).toEqual(normalizeHsl(base))
    const lightness = scale.map((s) => s.color.l)
    expect(lightness[0]).toBeGreaterThan(lightness[10])
  })
})
