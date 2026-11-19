<script setup>
import { onBeforeUnmount, onMounted, watchEffect } from 'vue'
import '~/assets/css/theme.css'

import { useColorStore } from '~/stores/color'
import { useClipboard } from '~/composables/useClipboard'
import { usePaletteActions } from '~/composables/usePaletteActions'
import { useToast } from '~/composables/useToast'
import { vTippy } from '~/directives/tippy'

const store = useColorStore()
const { copy } = useClipboard()
const { add } = usePaletteActions()
const { toast, hide } = useToast()

// The page's neutrals are derived from --h, so the whole UI tints toward the color being picked.
const root = typeof document === 'undefined' ? null : document.documentElement
watchEffect(() => root?.style.setProperty('--h', String(Math.round(store.color.h))))

async function share() {
  await copy(store.shareUrl(), 'link to this color and palette')
}

function runToastAction() {
  toast.action?.run()
  hide()
}

/* Shortcuts: A adds to the palette, C copies the default format, R picks a random color. */
function onKeydown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target
  if (target.closest?.('input, textarea, select, [contenteditable]')) return
  const key = event.key.toLowerCase()
  if (key === 'a') add()
  else if (key === 'c') copy(store.display)
  else if (key === 'r') store.randomize()
  else return
  event.preventDefault()
}

onMounted(() => {
  store.loadFromUrl()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.documentElement.style.removeProperty('--h')
})
</script>

<template>
  <div class="picker">
    <header class="bar">
      <h1 class="brand">
        HSL Color Picker
      </h1>
      <div class="bar__tools">
        <button
          v-tippy="'Random color (R)'"
          type="button"
          class="btn"
          @click="store.randomize()"
        >
          Random color
        </button>
        <button
          v-tippy="'Copy a link to this color and palette'"
          type="button"
          class="btn"
          @click="share"
        >
          Copy link
        </button>
      </div>
    </header>

    <div class="stage">
      <ColorChip />
      <ColorControls />
    </div>

    <PaletteTray />
    <ColorFormats />

    <div class="split">
      <ContrastCheck />
      <HarmonyList />
    </div>

    <div
      class="toast-region"
      role="status"
      aria-live="polite"
    >
      <Transition name="toast">
        <div
          v-if="toast.visible"
          class="toast"
        >
          <span>{{ toast.message }}</span>
          <button
            v-if="toast.action"
            type="button"
            class="toast__action"
            @click="runToastAction"
          >
            {{ toast.action.label }}
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: grid;
  gap: 32px;
  max-width: var(--content);
  margin: 0 auto;
  padding: 20px 24px 64px;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.bar__tools {
  display: flex;
  gap: 8px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
/* The mark is a hue wheel: the one thing every HSL color starts from. */
.brand::before {
  content: '';
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: conic-gradient(
    from 90deg,
    hsl(0 90% 55%),
    hsl(60 90% 55%),
    hsl(120 90% 45%),
    hsl(180 90% 45%),
    hsl(240 90% 60%),
    hsl(300 90% 55%),
    hsl(360 90% 55%)
  );
}

.stage {
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: 32px;
  align-items: stretch;
}

.split {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 48px;
  align-items: start;
}

.toast-region {
  position: fixed;
  right: 0;
  bottom: max(20px, env(safe-area-inset-bottom));
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 520px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--ink);
  color: var(--card);
  font-size: 0.9375rem;
  font-weight: 500;
  box-shadow: 0 12px 32px -12px rgb(0 0 0 / 0.5);
  pointer-events: auto;
}
.toast__action {
  padding: 4px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
.toast__action:focus-visible {
  outline-color: var(--card);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 960px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
  }
  .split {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
}
@media (max-width: 640px) {
  .picker {
    padding: 16px 16px 56px;
  }
}
</style>
