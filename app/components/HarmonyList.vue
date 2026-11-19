<script setup>
import { computed } from 'vue'
import { useColorStore } from '~/stores/color'
import { usePaletteActions } from '~/composables/usePaletteActions'
import { vTippy } from '~/directives/tippy'
import { HARMONIES, harmony, readableInk, shadeScale, toHex, toHsla } from '~/utils/color'

const store = useColorStore()
const { addMany } = usePaletteActions()

// Each row is a list of { color, isBase } so the base color can be marked in every scheme.
const rows = computed(() => [
  ...HARMONIES.map(scheme => ({
    id: scheme.id,
    label: scheme.label,
    cells: harmony(store.color, scheme.id).map((color, i) => ({ color, isBase: scheme.offsets[i] === 0 }))
  })),
  {
    id: 'scale',
    label: 'Shade scale',
    cells: shadeScale(store.color).map(s => ({ color: s.color, isBase: s.isBase, step: s.step }))
  }
])

const cellLabel = (row, cell) =>
  `${row.label}${cell.step ? ` ${cell.step}` : ''}: ${toHex(cell.color)}${cell.isBase ? ' (your color)' : ''}. Use this color`
</script>

<template>
  <section
    class="harmony"
    aria-labelledby="harmony-title"
  >
    <h2 id="harmony-title">
      Matching colors
    </h2>
    <p class="intro">
      Schemes built from your color. Select one to use it, or add a whole row to the palette.
    </p>

    <ul class="rows">
      <li
        v-for="row in rows"
        :key="row.id"
        class="row"
      >
        <span class="row__label">{{ row.label }}</span>
        <div class="strip">
          <button
            v-for="(cell, i) in row.cells"
            :key="i"
            v-tippy="toHex(cell.color)"
            type="button"
            class="cell checker"
            :aria-label="cellLabel(row, cell)"
            @click="store.setColor(cell.color)"
          >
            <span
              class="cell__fill"
              :style="{ background: toHsla(cell.color), color: readableInk(cell.color) }"
            >
              <span
                v-if="cell.isBase"
                class="cell__dot"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
        <button
          type="button"
          class="btn row__add"
          :aria-label="`Add ${row.label} colors to palette`"
          @click="addMany(row.cells.map((c) => c.color))"
        >
          Add
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.intro {
  margin-top: 4px;
  color: var(--ink-2);
  font-size: 0.9375rem;
}
.rows {
  display: grid;
  gap: 14px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}
.row {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}
.row__label {
  font-size: 0.9375rem;
  font-weight: 500;
}
.row__add {
  min-height: 36px;
  padding: 0 14px;
}

/* A strip of equal-width cells, like a paint-sample card. */
.strip {
  display: flex;
  overflow: hidden;
  height: 48px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}
.cell {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  padding: 0;
  border: 0;
  background-size: 12px 12px;
  cursor: pointer;
}
.cell__fill {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.cell__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.cell:hover .cell__fill {
  box-shadow: inset 0 0 0 3px rgb(255 255 255 / 0.7), inset 0 0 0 4px rgb(0 0 0 / 0.5);
}
.cell:focus-visible {
  z-index: 1;
  outline-offset: -3px;
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .row__label {
    grid-column: 1 / -1;
  }
}
</style>
