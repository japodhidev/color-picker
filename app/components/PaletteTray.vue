<script setup>
import { computed } from 'vue'
import { PALETTE_LIMIT, useColorStore } from '~/stores/color'
import { useClipboard } from '~/composables/useClipboard'
import { usePaletteActions } from '~/composables/usePaletteActions'
import { vTippy } from '~/directives/tippy'
import { toHex, toHsla } from '~/utils/color'
import { EXPORTS, exportPalette } from '~/utils/exporters'

const store = useColorStore()
const { copy } = useClipboard()
const { add, remove, clear } = usePaletteActions()

const isEmpty = computed(() => store.palette.length === 0)
const isFull = computed(() => store.palette.length >= PALETTE_LIMIT)

// Copy and export use the default format from the Formats section.
const values = computed(() => store.palette.map(p => store.formatWithPreference(p.color)))
const code = computed(() => exportPalette(values.value, store.exportFormat))
const exportLabel = computed(() => EXPORTS.find(e => e.id === store.exportFormat)?.label)
</script>

<template>
  <section
    class="tray card"
    aria-labelledby="palette-title"
  >
    <header class="head">
      <h2 id="palette-title">
        Palette <span class="count">{{ store.palette.length }} of {{ PALETTE_LIMIT }}</span>
      </h2>
      <div class="actions">
        <button
          type="button"
          class="btn"
          :disabled="isEmpty"
          @click="copy(values.join('\n'), `${values.length} colors`)"
        >
          Copy palette
        </button>
        <button
          type="button"
          class="btn btn--quiet"
          :disabled="isEmpty"
          @click="clear()"
        >
          Clear
        </button>
      </div>
    </header>

    <TransitionGroup
      tag="ul"
      name="swatch"
      class="list"
    >
      <li
        v-for="item in store.palette"
        :key="item.id"
        class="swatch"
      >
        <button
          v-tippy="'Use this color'"
          type="button"
          class="swatch__chip checker"
          :aria-label="`Use ${toHex(item.color)}`"
          @click="store.setColor(item.color)"
        >
          <span
            class="swatch__fill"
            :style="{ background: toHsla(item.color) }"
          />
        </button>
        <span class="swatch__hex">{{ toHex(item.color) }}</span>
        <button
          v-tippy="'Remove'"
          type="button"
          class="swatch__remove"
          :aria-label="`Remove ${toHex(item.color)}`"
          @click="remove(item.id)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </li>
      <li
        v-if="!isFull"
        key="add"
        class="swatch"
      >
        <button
          v-tippy="'Add current color (A)'"
          type="button"
          class="swatch__add"
          @click="add()"
        >
          <span aria-hidden="true">+</span>
          <span class="sr-only">Add current color to palette</span>
        </button>
        <span class="swatch__hex swatch__hex--hint">{{ isEmpty ? 'Add current' : '' }}</span>
      </li>
    </TransitionGroup>

    <details class="export">
      <summary>Export as code</summary>
      <div
        v-if="isEmpty"
        class="export__empty"
      >
        Add a color to the palette to see its code.
      </div>
      <div
        v-else
        class="export__body"
      >
        <div class="export__bar">
          <label class="export__pick">
            <span class="sr-only">Export format</span>
            <select
              v-model="store.exportFormat"
              class="field"
            >
              <option
                v-for="e in EXPORTS"
                :key="e.id"
                :value="e.id"
              >{{ e.label }}</option>
            </select>
          </label>
          <button
            type="button"
            class="btn"
            @click="copy(code, exportLabel)"
          >
            Copy code
          </button>
        </div>
        <pre class="export__code"><code>{{ code }}</code></pre>
      </div>
    </details>
  </section>
</template>

<style scoped>
.tray {
  padding: 20px;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.count {
  margin-left: 8px;
  color: var(--ink-2);
  font-size: 0.9375rem;
  font-weight: 400;
}
.actions {
  display: flex;
  gap: 8px;
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 16px 12px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}
.swatch {
  position: relative;
  display: grid;
  gap: 6px;
}
.swatch__chip {
  display: block;
  aspect-ratio: 1;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background-size: 12px 12px;
  cursor: pointer;
}
.swatch__fill {
  display: block;
  width: 100%;
  height: 100%;
}
.swatch__hex {
  overflow: hidden;
  color: var(--ink-2);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.swatch__hex--hint {
  min-height: 1.2em;
}

.swatch__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--ink);
  color: var(--card);
  font: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}
.swatch:hover .swatch__remove,
.swatch:focus-within .swatch__remove {
  opacity: 1;
}
@media (hover: none) {
  .swatch__remove {
    opacity: 1;
  }
}

.swatch__add {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  width: 100%;
  border: 2px dashed var(--line-strong);
  border-radius: 10px;
  background: transparent;
  color: var(--ink-2);
  font: inherit;
  font-size: 1.75rem;
  cursor: pointer;
  transition: background-color 0.15s;
}
.swatch__add:hover {
  background: var(--field);
  color: var(--ink);
}

/* A new swatch pops in; this answers the click that added it. */
.swatch-enter-active {
  animation: pop 0.22s ease-out;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
}

.export {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.export summary {
  display: inline-block;
  font-weight: 500;
  cursor: pointer;
}
.export__empty {
  margin-top: 12px;
  color: var(--ink-2);
  font-size: 0.9375rem;
}
.export__bar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.export__pick .field {
  width: auto;
  min-width: 160px;
}
.export__code {
  max-height: 280px;
  margin: 12px 0 0;
  padding: 16px;
  overflow: auto;
  border-radius: var(--radius-sm);
  background: var(--field);
  font-size: 0.875rem;
  line-height: 1.6;
}
.export__code code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
