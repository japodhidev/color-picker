export const EXPORTS = [
  { id: 'css', label: 'CSS variables' },
  { id: 'scss', label: 'SCSS' },
  { id: 'json', label: 'JSON' },
  { id: 'tailwind', label: 'Tailwind v4' }
]

/**
 * Turns palette colors into code. `values` is the list of already-formatted
 * color strings (in the user's chosen format), in palette order.
 */
export function exportPalette(values, id) {
  const lines = fn => values.map((v, i) => fn(v, i + 1)).join('\n')
  switch (id) {
    case 'scss':
      return lines((v, n) => `$color-${n}: ${v};`)
    case 'json':
      return JSON.stringify(Object.fromEntries(values.map((v, i) => [`color-${i + 1}`, v])), null, 2)
    case 'tailwind':
      return `@theme {\n${lines((v, n) => `  --color-palette-${n}: ${v};`)}\n}`
    default:
      return `:root {\n${lines((v, n) => `  --color-${n}: ${v};`)}\n}`
  }
}
