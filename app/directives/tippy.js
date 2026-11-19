import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/scale-subtle.css'

/**
 * v-tippy="'Tooltip text'" or v-tippy="{ content, placement, … }"
 *
 * A directive owns the tippy instance's lifecycle: it is created when the element
 * mounts, updated when the value changes and destroyed when the element goes away,
 * so tooltips never leak when the palette or harmony rows re-render.
 */
const toProps = (value) => (typeof value === 'string' ? { content: value } : value || {})

function mount(el, value) {
  if (!value) return
  tippy(el, {
    theme: 'chip',
    placement: 'top',
    animation: 'scale-subtle',
    delay: [350, 0],
    touch: false,
    ...toProps(value),
  })
}

export const vTippy = {
  mounted: (el, { value }) => mount(el, value),
  updated(el, { value, oldValue }) {
    if (value === oldValue) return
    const instance = el._tippy
    if (!value) instance?.destroy()
    else if (instance) instance.setProps(toProps(value))
    else mount(el, value)
  },
  unmounted: (el) => el._tippy?.destroy(),
}
