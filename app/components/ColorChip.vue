<script setup>
import { computed } from 'vue'
import { useColorStore } from '~/stores/color'
import { useClipboard } from '~/composables/useClipboard'
import { usePaletteActions } from '~/composables/usePaletteActions'
import { vTippy } from '~/directives/tippy'
import { FORMATS, toHsla } from '~/utils/color'

const store = useColorStore()
const { copy } = useClipboard()
const { add } = usePaletteActions()

const fill = computed(() => toHsla(store.color))
const formatLabel = computed(() => FORMATS.find(f => f.id === store.format)?.label)
const nameNote = computed(() => (store.name.exact ? 'CSS color name' : 'Closest CSS color name'))
</script>

<template>
  <article
    class="chip"
    :style="{ '--chip': fill }"
  >
    <div class="chip__swatch checker">
      <div
        class="chip__fill"
        :style="{ background: fill }"
      />
      <span
        class="chip__hole"
        aria-hidden="true"
      />
    </div>

    <div class="chip__body">
      <div>
        <p class="chip__name">
          {{ store.name.name }}
        </p>
        <p class="chip__note">
          {{ nameNote }}
        </p>
      </div>

      <div class="chip__value">
        <code class="chip__code">{{ store.display }}</code>
        <button
          v-tippy="'Copy (C)'"
          type="button"
          class="btn btn--primary"
          :aria-label="`Copy ${formatLabel} value`"
          @click="copy(store.display)"
        >
          Copy
        </button>
      </div>

      <button
        v-tippy="'Add to palette (A)'"
        type="button"
        class="btn chip__add"
        @click="add()"
      >
        Add to palette
      </button>
    </div>
  </article>
</template>

<style scoped>
/* A paint-chip card: a block of color with a punched hole, and the label printed underneath. */
.chip {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  /* The chip casts a shadow in its own color. */
  box-shadow: 0 36px 48px -34px var(--chip);
}

.chip__swatch {
  position: relative;
  min-height: 260px;
  flex: 1;
}
.chip__fill {
  position: absolute;
  inset: 0;
}
.chip__hole {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--card);
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.4);
}

.chip__body {
  display: grid;
  gap: 16px;
  padding: 20px;
}
.chip__name {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.chip__note {
  margin-top: 4px;
  color: var(--ink-2);
  font-size: 0.875rem;
}

.chip__value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.chip__code {
  min-width: 0;
  font-family: inherit;
  font-size: 1.0625rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.chip__add {
  width: 100%;
}
</style>
