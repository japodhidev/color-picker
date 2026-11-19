import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { FORMATS, formatColor, hslToRgb, nearestName, normalizeHsl, parseColor, randomColor, toHex } from '../utils/color'

export const PALETTE_LIMIT = 12
const STORAGE_KEY = 'hsl-color-picker:v2'
const DEFAULT_COLOR = { h: 212, s: 100, l: 50, a: 1 }

function readStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const entry = color => ({ id: uid(), color: normalizeHsl(color) })

/**
 * The picker's single source of truth: the current color, the palette and the
 * user's output preferences. Everything else (RGB, names, contrast…) is derived.
 * State is saved to localStorage so a refresh doesn't lose your work.
 */
export const useColorStore = defineStore('color', () => {
  const saved = readStorage()

  const color = ref(normalizeHsl(saved.color ?? DEFAULT_COLOR))
  const palette = ref(
    Array.isArray(saved.palette)
      ? saved.palette
          .filter(p => p && typeof p === 'object')
          .slice(0, PALETTE_LIMIT)
          .map(p => ({ id: typeof p.id === 'string' ? p.id : uid(), color: normalizeHsl(p.color) }))
      : []
  )
  const format = ref(FORMATS.some(f => f.id === saved.format) ? saved.format : 'hex')
  const legacy = ref(Boolean(saved.legacy))
  const exportFormat = ref(['css', 'scss', 'json', 'tailwind'].includes(saved.exportFormat) ? saved.exportFormat : 'css')

  /* ---- Derived ---- */

  const rgb = computed(() => hslToRgb(color.value))
  const hex = computed(() => toHex(color.value))
  const display = computed(() => formatColor(color.value, format.value, { legacy: legacy.value }))
  const name = computed(() => nearestName(rgb.value))

  /** Formats any color with the user's chosen format and syntax. */
  const formatWithPreference = c => formatColor(c, format.value, { legacy: legacy.value })

  /* ---- Current color ---- */

  function setColor(partial) {
    color.value = normalizeHsl({ ...color.value, ...partial })
  }

  /** Accepts any pasted color string. Returns false if it isn't one. */
  function setFromString(text) {
    const parsed = parseColor(text)
    if (!parsed) return false
    color.value = parsed
    return true
  }

  function randomize() {
    color.value = randomColor()
  }

  /* ---- Palette ---- */

  const paletteHas = c => palette.value.some(p => toHex(p.color) === toHex(c))

  /** Returns 'added', 'duplicate' or 'full'. */
  function addToPalette(c = color.value) {
    if (paletteHas(c)) return 'duplicate'
    if (palette.value.length >= PALETTE_LIMIT) return 'full'
    palette.value.push(entry(c))
    return 'added'
  }

  function addMany(colors) {
    const result = { added: 0, skipped: 0 }
    for (const c of colors) {
      if (addToPalette(c) === 'added') result.added++
      else result.skipped++
    }
    return result
  }

  const removeFromPalette = (id) => {
    palette.value = palette.value.filter(p => p.id !== id)
  }
  const setPalette = (list) => {
    palette.value = list
  }

  /* ---- Sharing ---- */

  /** A link that reopens the same color and palette: ?c=1e7bff&p=ff0000-00ff00 */
  function shareUrl() {
    const url = new URL(window.location.href)
    url.searchParams.set('c', toHex(color.value).slice(1))
    if (palette.value.length) url.searchParams.set('p', palette.value.map(p => toHex(p.color).slice(1)).join('-'))
    else url.searchParams.delete('p')
    return url.toString()
  }

  /** Call once on load: a shared link wins over whatever was saved locally. */
  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('c') && parseColor(params.get('c'))
    if (c) color.value = c
    const p = params.get('p')
    if (p) {
      const list = p
        .split('-')
        .map(parseColor)
        .filter(Boolean)
        .slice(0, PALETTE_LIMIT)
        .map(entry)
      if (list.length) palette.value = list
    }
  }

  /* ---- Persistence ---- */

  let saveTimer
  watch(
    [color, palette, format, legacy, exportFormat],
    () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              color: color.value,
              palette: palette.value,
              format: format.value,
              legacy: legacy.value,
              exportFormat: exportFormat.value
            })
          )
        } catch {
          /* Storage can be full or disabled (private mode). The picker still works. */
        }
      }, 150)
    },
    { deep: true }
  )

  return {
    color,
    palette,
    format,
    legacy,
    exportFormat,
    rgb,
    hex,
    display,
    name,
    formatWithPreference,
    setColor,
    setFromString,
    randomize,
    addToPalette,
    addMany,
    removeFromPalette,
    setPalette,
    shareUrl,
    loadFromUrl
  }
})
