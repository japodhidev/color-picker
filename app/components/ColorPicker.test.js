// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ColorPicker from '~/ColorPicker.vue'
import LandingPage from '~/LandingPage.vue'
import { useColorStore } from '~/stores/color'
import { useToast } from '~/composables/useToast'

let writeText
let warn
let wrapper

const settle = async () => {
  await nextTick()
  await nextTick()
}

function mountPicker() {
  const pinia = createPinia()
  setActivePinia(pinia)
  wrapper = mount(ColorPicker, { global: { plugins: [pinia] }, attachTo: document.body })
  return useColorStore()
}

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
  writeText = vi.fn().mockResolvedValue()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  wrapper?.unmount()
  useToast().hide()
  vi.useRealTimers()
  expect(warn, 'Vue warnings').not.toHaveBeenCalled()
  warn.mockRestore()
})

describe('ColorPicker', () => {
  it('renders every section and the starting color', async () => {
    const store = mountPicker()
    await settle()
    const text = wrapper.text()
    for (const heading of ['HSL Color Picker', 'Palette', 'Formats', 'Contrast', 'Matching colors']) expect(text).toContain(heading)
    expect(store.hex).toBe('#0077ff')
    expect(wrapper.findAll('.row').length).toBeGreaterThanOrEqual(10 + 6) // 10 formats + 6 harmony rows
  })

  it('copies the default format and confirms with a toast', async () => {
    mountPicker()
    await settle()
    await wrapper.find('.chip__value button').trigger('click')
    await settle()
    expect(writeText).toHaveBeenCalledWith('#0077ff')
    expect(wrapper.find('.toast').text()).toContain('Copied #0077ff')
  })

  it('changes the copied value when the default format changes', async () => {
    const store = mountPicker()
    await settle()
    store.format = 'hsl'
    await settle()
    await wrapper.find('.chip__value button').trigger('click')
    expect(writeText).toHaveBeenCalledWith('hsl(212 100% 50%)')
    store.legacy = true
    await settle()
    await wrapper.find('.chip__value button').trigger('click')
    expect(writeText).toHaveBeenLastCalledWith('hsl(212, 100%, 50%)')
  })

  it('accepts a pasted color and rejects nonsense with a message', async () => {
    const store = mountPicker()
    await settle()
    const input = wrapper.find('input[aria-label="Paste a color"]')
    await input.setValue('rgb(255 0 0)')
    await wrapper.find('form').trigger('submit')
    expect(store.hex).toBe('#ff0000')
    expect(input.element.value).toBe('')

    await input.setValue('not a color')
    await wrapper.find('form').trigger('submit')
    expect(store.hex).toBe('#ff0000')
    expect(wrapper.find('#paste-help').text()).toContain('not a color this picker recognizes')
  })

  it('moves the color from the hue strip, numeric fields and keyboard', async () => {
    const store = mountPicker()
    await settle()

    const hue = wrapper.find('input[aria-label="Hue"]')
    hue.element.value = '120'
    await hue.trigger('input')
    expect(store.color.h).toBe(120)

    const numbers = wrapper.findAll('input[type="number"]')
    numbers[1].element.value = '40'
    await numbers[1].trigger('input')
    expect(store.color.s).toBe(40)

    numbers[2].element.value = '500' // out of range: clamps instead of breaking
    await numbers[2].trigger('input')
    expect(store.color.l).toBe(100)

    const plane = wrapper.find('.plane')
    await plane.trigger('keydown', { key: 'ArrowLeft' })
    expect(store.color.s).toBe(39)
    await plane.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    expect(store.color.l).toBe(90)
  })

  it('sets saturation and lightness from pointer position on the plane', async () => {
    const store = mountPicker()
    await settle()
    const plane = wrapper.find('.plane')
    plane.element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 })
    await plane.trigger('pointerdown', { clientX: 50, clientY: 25, pointerId: 1 })
    expect(store.color.s).toBe(25)
    expect(store.color.l).toBe(75)
    await plane.trigger('pointermove', { clientX: 400, clientY: -50, pointerId: 1 }) // outside: clamped
    expect(store.color.s).toBe(100)
    expect(store.color.l).toBe(100)
    await plane.trigger('pointerup', { pointerId: 1 })
    await plane.trigger('pointermove', { clientX: 0, clientY: 0, pointerId: 1 }) // released: ignored
    expect(store.color.s).toBe(100)
  })

  it('tints the page from the current hue', async () => {
    const store = mountPicker()
    store.setColor({ h: 300 })
    await settle()
    expect(document.documentElement.style.getPropertyValue('--h')).toBe('300')
  })

  it('manages the palette: add, duplicate, limit, undoable remove and clear', async () => {
    const store = mountPicker()
    await settle()
    const addButton = () => wrapper.find('.chip__add')

    await addButton().trigger('click')
    expect(store.palette).toHaveLength(1)
    await addButton().trigger('click')
    expect(store.palette).toHaveLength(1)
    expect(wrapper.find('.toast').text()).toContain('already in the palette')

    for (let i = 0; i < 20; i++) {
      store.setColor({ h: i * 17 })
      await addButton().trigger('click')
    }
    expect(store.palette).toHaveLength(12)
    expect(wrapper.find('.toast').text()).toContain('Palette is full')

    await wrapper.find('.swatch__remove').trigger('click')
    expect(store.palette).toHaveLength(11)
    await wrapper.find('.toast__action').trigger('click')
    expect(store.palette).toHaveLength(12)

    const clear = wrapper.findAll('.actions .btn').find(b => b.text() === 'Clear')
    await clear.trigger('click')
    expect(store.palette).toHaveLength(0)
    await wrapper.find('.toast__action').trigger('click')
    expect(store.palette).toHaveLength(12)
  })

  it('loads a swatch back into the picker', async () => {
    const store = mountPicker()
    store.addToPalette({ h: 10, s: 80, l: 40, a: 1 })
    store.setColor({ h: 200 })
    await settle()
    await wrapper.find('.swatch__chip').trigger('click')
    expect(store.color.h).toBe(10)
  })

  it('adds a whole harmony row to the palette', async () => {
    const store = mountPicker()
    await settle()
    const triadic = wrapper.findAll('.harmony .row').find(r => r.text().includes('Triadic'))
    await triadic.find('.row__add').trigger('click')
    expect(store.palette).toHaveLength(3)
    expect(wrapper.find('.toast').text()).toContain('Added 3 colors')
  })

  it('exports the palette in the chosen format', async () => {
    const store = mountPicker()
    store.addMany([{ h: 0, s: 100, l: 50, a: 1 }, { h: 120, s: 100, l: 50, a: 1 }])
    await settle()
    expect(wrapper.find('.export__code').text()).toBe(':root {\n  --color-1: #ff0000;\n  --color-2: #00ff00;\n}')
    store.exportFormat = 'tailwind'
    store.format = 'rgb'
    await settle()
    expect(wrapper.find('.export__code').text()).toBe('@theme {\n  --color-palette-1: rgb(255 0 0);\n  --color-palette-2: rgb(0 255 0);\n}')
  })

  it('handles the A, C and R shortcuts, but not while typing', async () => {
    const store = mountPicker()
    await settle()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(store.palette).toHaveLength(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }))
    await settle()
    expect(writeText).toHaveBeenCalledWith('#0077ff')
    const before = store.hex
    const input = wrapper.find('input[aria-label="Paste a color"]').element
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }))
    expect(store.hex).toBe(before)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true })) // Ctrl+R still reloads the page
    expect(store.hex).toBe(before)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))
    expect(store.hex === before && store.color.h === 212).toBe(false)
  })

  it('persists to localStorage and restores', async () => {
    vi.useFakeTimers()
    let store = mountPicker()
    store.setColor({ h: 33 })
    store.addToPalette({ h: 90, s: 50, l: 50, a: 1 })
    store.format = 'oklch'
    await settle()
    vi.advanceTimersByTime(200)
    wrapper.unmount()

    store = mountPicker()
    expect(store.color.h).toBe(33)
    expect(store.palette).toHaveLength(1)
    expect(store.format).toBe('oklch')
  })

  it('survives corrupt saved data', () => {
    localStorage.setItem('hsl-color-picker:v2', '{"color": {"h": "banana"}, "palette": [{"color": null}], "format": "nope"}')
    const store = mountPicker()
    expect(store.hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(store.format).toBe('hex')
  })

  it('round-trips through a share link', async () => {
    let store = mountPicker()
    store.setColor({ h: 0, s: 100, l: 50 })
    store.addMany([{ h: 120, s: 100, l: 50, a: 1 }, { h: 240, s: 100, l: 50, a: 1 }])
    const url = store.shareUrl()
    expect(url).toContain('c=ff0000')
    expect(url).toContain('p=00ff00-0000ff')
    wrapper.unmount()

    localStorage.clear()
    window.history.replaceState({}, '', new URL(url).search)
    store = mountPicker()
    store.loadFromUrl()
    expect(store.hex).toBe('#ff0000')
    expect(store.palette.map(p => p.color.h)).toEqual([120, 240])
  })

  it('reports contrast and flags the better text color', async () => {
    const store = mountPicker()
    store.setFromString('#ffff00') // yellow: black text wins
    await settle()
    const pairs = wrapper.findAll('.pair')
    expect(pairs[0].text()).toContain('1.07 : 1')
    expect(pairs[0].text()).toContain('Fail')
    expect(pairs[1].text()).toContain('Better choice')
    expect(pairs[1].text()).toContain('19.55 : 1')
  })
})

describe('LandingPage', () => {
  it('renders the description with accessible structure', () => {
    wrapper = mount(LandingPage)
    expect(wrapper.find('h2').text()).toContain('any format')
    expect(wrapper.findAll('.about__features li')).toHaveLength(6)
    expect(wrapper.findAll('kbd')).toHaveLength(3)
  })
})
