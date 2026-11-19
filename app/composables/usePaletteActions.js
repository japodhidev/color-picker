import { PALETTE_LIMIT, useColorStore } from '../stores/color'
import { useToast } from './useToast'

/** Palette changes plus the toast that confirms each one, so every button words them the same way. */
export function usePaletteActions() {
  const store = useColorStore()
  const { show } = useToast()

  function add(color = store.color) {
    const result = store.addToPalette(color)
    if (result === 'added') show('Added to palette')
    else if (result === 'duplicate') show('That color is already in the palette')
    else show(`Palette is full (${PALETTE_LIMIT} colors). Remove one to add another.`)
  }

  function addMany(colors) {
    const { added, skipped } = store.addMany(colors)
    if (!added) show(skipped ? 'Those colors are already in the palette, or it is full' : 'Nothing to add')
    else show(`Added ${added} ${added === 1 ? 'color' : 'colors'} to palette${skipped ? ` (${skipped} skipped)` : ''}`)
  }

  function remove(id) {
    const before = store.palette.slice()
    store.removeFromPalette(id)
    show('Removed from palette', { label: 'Undo', run: () => store.setPalette(before) })
  }

  function clear() {
    const before = store.palette.slice()
    store.setPalette([])
    show('Palette cleared', { label: 'Undo', run: () => store.setPalette(before) })
  }

  return { add, addMany, remove, clear }
}
