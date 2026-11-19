<script setup>
import { computed, ref } from 'vue'
import { useColorStore } from '~/stores/color'
import { vTippy } from '~/directives/tippy'
import { clamp, toHsla } from '~/utils/color'

const store = useColorStore()

/* ---- Paste any color ---- */

const draft = ref('')
const error = ref('')

function applyDraft(text = draft.value) {
  if (!text.trim()) {
    error.value = ''
    return
  }
  if (store.setFromString(text)) {
    draft.value = ''
    error.value = ''
  } else {
    error.value = 'That is not a color this picker recognizes. Try a hex code, rgb(), hsl(), oklch() or a CSS color name.'
  }
}

function onPaste(event) {
  const text = event.clipboardData?.getData('text')
  if (!text) return
  event.preventDefault()
  draft.value = text.trim()
  applyDraft(draft.value)
}

/* ---- Eyedropper (Chromium browsers only) ---- */

const canEyedrop = typeof window !== 'undefined' && 'EyeDropper' in window

async function eyedrop() {
  try {
    const { sRGBHex } = await new window.EyeDropper().open()
    store.setFromString(sRGBHex)
  } catch {
    /* The person pressed Escape. Nothing to do. */
  }
}

/* ---- Saturation / lightness plane ---- */

const plane = ref(null)
const dragging = ref(false)

// In HSL, one hue forms a plane: saturation runs left to right, lightness bottom to top.
// Each half of it is bi-linear in RGB, so two stacked gradients reproduce it exactly.
const planeStyle = computed(() => {
  const h = store.color.h
  return {
    background: [
      'linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, #000 100%)',
      `linear-gradient(to right, hsl(${h}, 0%, 50%), hsl(${h}, 100%, 50%))`
    ].join(',')
  }
})

function moveTo(event) {
  const box = plane.value.getBoundingClientRect()
  const x = clamp((event.clientX - box.left) / box.width, 0, 1)
  const y = clamp((event.clientY - box.top) / box.height, 0, 1)
  store.setColor({ s: Math.round(x * 100), l: Math.round((1 - y) * 100) })
}

function onPointerDown(event) {
  dragging.value = true
  plane.value.setPointerCapture?.(event.pointerId)
  moveTo(event)
}
function onPointerMove(event) {
  if (dragging.value) moveTo(event)
}
function onPointerUp(event) {
  dragging.value = false
  plane.value.releasePointerCapture?.(event.pointerId)
}

function onPlaneKey(event) {
  const step = event.shiftKey ? 10 : 1
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
  const move = moves[event.key]
  if (!move) return
  event.preventDefault()
  store.setColor({ s: store.color.s + move[0], l: store.color.l + move[1] })
}

const thumbFill = computed(() => toHsla({ ...store.color, a: 1 }))

/* ---- Hue and alpha strips ---- */

const hueTrack
  = 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))'

const hueStyle = computed(() => ({ '--track': hueTrack, '--thumb': `hsl(${store.color.h}, 100%, 50%)` }))
const alphaStyle = computed(() => {
  const { h, s, l } = store.color
  return {
    '--track': `linear-gradient(to right, hsla(${h}, ${s}%, ${l}%, 0), hsla(${h}, ${s}%, ${l}%, 1))`,
    '--thumb': toHsla({ ...store.color, a: 1 })
  }
})

/* ---- Numeric fields ---- */

const fields = [
  { key: 'h', label: 'Hue', min: 0, max: 360, step: 1 },
  { key: 's', label: 'Saturation', min: 0, max: 100, step: 1 },
  { key: 'l', label: 'Lightness', min: 0, max: 100, step: 1 },
  { key: 'a', label: 'Alpha', min: 0, max: 1, step: 0.01 }
]

const shown = key => (key === 'a' ? store.color.a : Math.round(store.color[key]))

function onField(key, event) {
  const value = event.target.valueAsNumber
  if (!Number.isNaN(value)) store.setColor({ [key]: value })
}
// If someone types 500 into a 0–360 field, snap the text back to the clamped value.
function syncField(key, event) {
  event.target.value = shown(key)
}
</script>

<template>
  <section
    class="controls card"
    aria-label="Color controls"
  >
    <form
      class="paste"
      @submit.prevent="applyDraft()"
    >
      <div class="paste__row">
        <input
          v-model="draft"
          class="field"
          type="text"
          spellcheck="false"
          autocomplete="off"
          aria-label="Paste a color"
          aria-describedby="paste-help"
          :aria-invalid="error ? 'true' : 'false'"
          placeholder="Paste a color: #1e7bff, rgb(30 123 255), oklch(…)"
          @paste="onPaste"
          @blur="applyDraft()"
        >
        <button
          v-if="canEyedrop"
          v-tippy="'Pick a color from anywhere on your screen'"
          type="button"
          class="btn"
          @click="eyedrop"
        >
          Eyedropper
        </button>
      </div>
      <p
        id="paste-help"
        class="paste__help"
        :class="{ 'paste__help--error': error }"
        aria-live="polite"
      >
        {{ error }}
      </p>
    </form>

    <div
      ref="plane"
      class="plane"
      role="slider"
      tabindex="0"
      aria-label="Saturation and lightness"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(store.color.s)"
      :aria-valuetext="`Saturation ${Math.round(store.color.s)}%, lightness ${Math.round(store.color.l)}%`"
      :style="planeStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onPlaneKey"
    >
      <span
        class="plane__thumb"
        :style="{ left: store.color.s + '%', top: 100 - store.color.l + '%', background: thumbFill }"
      />
    </div>

    <div class="strips">
      <input
        class="strip"
        type="range"
        min="0"
        max="360"
        step="1"
        aria-label="Hue"
        :value="store.color.h"
        :style="hueStyle"
        @input="store.setColor({ h: $event.target.valueAsNumber })"
      >
      <input
        class="strip strip--alpha"
        type="range"
        min="0"
        max="1"
        step="0.01"
        aria-label="Alpha"
        :value="store.color.a"
        :style="alphaStyle"
        @input="store.setColor({ a: $event.target.valueAsNumber })"
      >
    </div>

    <div class="numbers">
      <label
        v-for="f in fields"
        :key="f.key"
        class="number"
      >
        <span class="number__label">{{ f.label }}</span>
        <input
          class="field"
          type="number"
          inputmode="decimal"
          :min="f.min"
          :max="f.max"
          :step="f.step"
          :value="shown(f.key)"
          @input="onField(f.key, $event)"
          @blur="syncField(f.key, $event)"
        >
      </label>
    </div>
  </section>
</template>

<style scoped>
.controls {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 20px;
}

/* ---- Paste ---- */
.paste__row {
  display: flex;
  gap: 8px;
}
.paste__help {
  min-height: 1.4em;
  margin-top: 6px;
  color: var(--ink-2);
  font-size: 0.8125rem;
}
.paste__help--error {
  color: var(--ink);
  font-weight: 500;
}
.paste__help:empty {
  min-height: 0;
  margin: 0;
}

/* ---- Plane ---- */
.plane {
  position: relative;
  height: clamp(220px, 32vw, 300px);
  border-radius: 10px;
  cursor: crosshair;
  touch-action: none; /* keep the page from scrolling while dragging on touch screens */
  user-select: none;
}
.plane__thumb {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ---- Range strips ---- */
.strips {
  display: grid;
  gap: 16px;
}
.strip {
  width: 100%;
  height: 16px;
  margin: 0;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}
.strip::-webkit-slider-runnable-track {
  height: 16px;
  border-radius: 8px;
  background: var(--track);
}
.strip::-moz-range-track {
  height: 16px;
  border-radius: 8px;
  background: var(--track);
}
.strip--alpha::-webkit-slider-runnable-track {
  background: var(--track), conic-gradient(#d6d6d6 25%, #fff 0 50%, #d6d6d6 0 75%, #fff 0) 0 0 / 12px 12px;
}
.strip--alpha::-moz-range-track {
  background: var(--track), conic-gradient(#d6d6d6 25%, #fff 0 50%, #d6d6d6 0 75%, #fff 0) 0 0 / 12px 12px;
}
.strip::-webkit-slider-thumb {
  width: 24px;
  height: 24px;
  margin-top: -4px; /* centers a 24px thumb on the 16px track */
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--thumb);
  box-shadow: 0 0 0 1.5px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.35);
  appearance: none;
  -webkit-appearance: none;
}
.strip::-moz-range-thumb {
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--thumb);
  box-shadow: 0 0 0 1.5px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.35);
}
.strip:focus-visible {
  outline-offset: 6px;
}

/* ---- Numeric fields ---- */
.numbers {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.number {
  display: grid;
  gap: 6px;
}
.number__label {
  color: var(--ink-2);
  font-size: 0.8125rem;
  font-weight: 500;
}
.number .field {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 480px) {
  .numbers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .paste__row {
    flex-direction: column;
  }
}
</style>
