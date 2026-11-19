<script setup>
import { computed } from 'vue'
import { useColorStore } from '~/stores/color'
import { BLACK, WHITE, contrastReport, toHsla } from '~/utils/color'

const store = useColorStore()

const opaque = computed(() => toHsla({ ...store.color, a: 1 }))

// Contrast is symmetric, so one ratio covers both "white text on this color"
// and "this color as text on white".
const pairs = computed(() => {
  const white = contrastReport(store.rgb, WHITE)
  const black = contrastReport(store.rgb, BLACK)
  const best = white.ratio >= black.ratio ? 'white' : 'black'
  return [
    { id: 'white', name: 'White text', ink: '#fff', report: white, best: best === 'white' },
    { id: 'black', name: 'Black text', ink: '#000', report: black, best: best === 'black' }
  ]
})

const checks = report => [
  { label: 'AA, body text', hint: '4.5 : 1', pass: report.aa },
  { label: 'AA, large text', hint: '3 : 1', pass: report.aaLarge },
  { label: 'AAA, body text', hint: '7 : 1', pass: report.aaa }
]
</script>

<template>
  <section
    class="contrast"
    aria-labelledby="contrast-title"
  >
    <h2 id="contrast-title">
      Contrast
    </h2>
    <p class="intro">
      How readable text is on this color, using WCAG ratios.
    </p>

    <div class="pairs">
      <article
        v-for="p in pairs"
        :key="p.id"
        class="pair card"
      >
        <div
          class="sample"
          :style="{ background: opaque, color: p.ink }"
        >
          <span
            class="sample__big"
            aria-hidden="true"
          >Aa</span>
          <span class="sample__small">{{ p.name }}</span>
        </div>
        <div class="result">
          <p class="ratio">
            {{ p.report.shown }} : 1
            <span
              v-if="p.best"
              class="best"
            >Better choice</span>
          </p>
          <ul class="checks">
            <li
              v-for="c in checks(p.report)"
              :key="c.label"
            >
              <span>{{ c.label }}</span>
              <strong :class="c.pass ? 'pass' : 'fail'">
                <span aria-hidden="true">{{ c.pass ? '✓' : '✕' }}</span>
                {{ c.pass ? 'Pass' : 'Fail' }}
              </strong>
            </li>
          </ul>
        </div>
      </article>
    </div>
    <p
      v-if="store.color.a < 1"
      class="note"
    >
      Ratios are calculated at full opacity.
    </p>
  </section>
</template>

<style scoped>
.intro,
.note {
  margin-top: 4px;
  color: var(--ink-2);
  font-size: 0.9375rem;
}
.note {
  margin-top: 12px;
  font-size: 0.8125rem;
}
.pairs {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.pair {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  overflow: hidden;
}
.sample {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 2px;
  min-height: 132px;
  padding: 14px;
}
.sample__big {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}
.sample__small {
  font-size: 0.875rem;
  font-weight: 500;
}
.result {
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 14px 16px;
}
.ratio {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  font-size: 1.125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.best {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--card);
  font-size: 0.75rem;
  font-weight: 500;
}
.checks {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.875rem;
}
.checks li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.checks li > span {
  color: var(--ink-2);
}
.fail {
  font-weight: 500;
  color: var(--ink-2);
}
.pass {
  font-weight: 700;
}

@media (max-width: 420px) {
  .pair {
    grid-template-columns: 104px minmax(0, 1fr);
  }
}
</style>
