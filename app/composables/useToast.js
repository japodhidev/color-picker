import { reactive, readonly } from 'vue'

/**
 * One toast shared by the whole picker. Any component can call show();
 * ColorPicker.vue renders it inside an aria-live region.
 */
const state = reactive({ visible: false, message: '', action: null })
let timer

export function useToast() {
  function hide() {
    clearTimeout(timer)
    state.visible = false
  }

  /** `action` is optional: { label: 'Undo', run: () => … }. Toasts with an action stay longer. */
  function show(message, action = null) {
    clearTimeout(timer)
    state.message = message
    state.action = action
    state.visible = true
    timer = setTimeout(hide, action ? 6000 : 3200)
  }

  return { toast: readonly(state), show, hide }
}
