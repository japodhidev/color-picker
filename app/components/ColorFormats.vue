<script setup>
import { computed } from 'vue'
import { useColorStore } from '~/stores/color'
import { useClipboard } from '~/composables/useClipboard'
import { FORMATS, formatColor } from '~/utils/color'

const store = useColorStore()
const { copy } = useClipboard()

const rows = computed(() =>
  FORMATS.map(f => ({
    ...f,
    value: formatColor(store.color, f.id, { legacy: store.legacy })
  }))
)
</script>

<template>
  <section
    class="formats"
    aria-labelledby="formats-title"
  >
    <header class="head">
      <h2 id="formats-title">
        Formats
      </h2>
      <div class="settings">
        <label class="setting">
          <span>Default format</span>
          <select
            v-model="store.format"
            class="field"
          >
            <option
              v-for="f in FORMATS"
              :key="f.id"
              :value="f.id"
            >{{ f.label }}</option>
          </select>
        </label>
        <label class="setting setting--check">
          <input
            v-model="store.legacy"
            type="checkbox"
          >
          <span>Comma syntax for rgb() and hsl()</span>
        </label>
      </div>
    </header>

    <ul class="grid">
      <li
        v-for="row in rows"
        :key="row.id"
      >
        <button
          type="button"
          class="row"
          :class="{ 'row--default': row.id === store.format }"
          :aria-label="`Copy ${row.label}: ${row.value}`"
          @click="copy(row.value)"
        >
          <span class="row__label">{{ row.label }}</span>
          <span class="row__value">{{ row.value }}</span>
          <span
            v-if="!row.css"
            class="row__tag"
          >Not CSS</span>
          <span
            class="row__copy"
            aria-hidden="true"
          >Copy</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.settings {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 24px;
}
.setting {
  display: grid;
  gap: 4px;
  color: var(--ink-2);
  font-size: 0.8125rem;
  font-weight: 500;
}
.setting .field {
  width: auto;
  min-width: 140px;
}
.setting--check {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  font-size: 0.9375rem;
  color: var(--ink);
  font-weight: 400;
}
.setting--check input {
  width: 18px;
  height: 18px;
  accent-color: var(--ink);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}
.row:hover {
  background: var(--field);
}
.row--default {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.row__label {
  font-weight: 700;
}
.row__value {
  overflow: hidden;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row__tag {
  padding: 2px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-2);
  font-size: 0.75rem;
  white-space: nowrap;
}
.row__copy {
  color: var(--ink-2);
  font-size: 0.875rem;
  font-weight: 500;
}
.row:hover .row__copy,
.row:focus-visible .row__copy {
  color: var(--ink);
}

@media (max-width: 480px) {
  .row {
    grid-template-columns: 52px minmax(0, 1fr) auto;
  }
  .row__copy {
    display: none;
  }
}
</style>
