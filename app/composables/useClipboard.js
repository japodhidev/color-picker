import { useToast } from './useToast'

async function writeText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* Permission denied or insecure context: fall through to the legacy path. */
    }
  }
  const previous = document.activeElement
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  previous?.focus?.()
  return ok
}

/** copy(text, label) copies and confirms with a toast: "Copied <label>". */
export function useClipboard() {
  const { show } = useToast()

  async function copy(text, label = text) {
    const ok = await writeText(text)
    show(ok ? `Copied ${label}` : 'Couldn\'t copy. Select the value and copy it manually.')
    return ok
  }

  return { copy }
}
