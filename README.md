# HSL Color Picker

A color picker built around HSL that converts any color into ten formats, checks its contrast, suggests matching colors and keeps an exportable palette. Built with Vue 3 and Pinia. The color maths is written from scratch, with no color libraries, and covered by unit tests.

## Features

- **Ten formats.** HEX, RGB, HSL, HWB, OKLCH, OKLab, LCH, Lab, HSV and CMYK. Select any value to copy it.
- **Paste anything.** Type or paste a hex code, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()` or `oklch()` value (modern or comma syntax) or a CSS color name. The controls jump to it.
- **Alpha everywhere.** Every format that supports transparency includes it.
- **Default format and syntax.** Choose the format used for the chip, the palette and exports, and switch `rgb()` and `hsl()` between modern syntax (`rgb(0 119 255 / 0.5)`) and comma syntax (`rgba(0, 119, 255, 0.5)`).
- **Contrast checker.** WCAG contrast ratios against white and black text, with AA and AAA results and a pointer to the better choice.
- **Matching colors.** Complementary, analogous, triadic, split complementary and tetradic schemes, plus an 11-step shade scale (50 to 950) built in OKLCH.
- **Palette.** Save up to 12 colors, load any swatch back into the picker, and undo removing or clearing. The palette is saved in your browser.
- **Export.** Copy the palette as CSS variables, SCSS, JSON or a Tailwind v4 `@theme` block.
- **Share links.** Copy a link that reopens the same color and palette.
- **Eyedropper.** Pick a color from anywhere on your screen (browsers that support the [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API), currently Chromium-based ones).
- **Closest CSS name.** Every color is labelled with the nearest named CSS color, such as `cornflowerblue`.
- **Light and dark themes.** Follows your system setting. The page's neutral colors are derived from the hue you are picking, so the whole UI takes a faint tint of your color.

### Formats

Example output for `hsl(212 100% 50%)`:

| Format | Output | Valid CSS |
| --- | --- | --- |
| HEX | `#0077ff` | Yes |
| RGB | `rgb(0 119 255)` | Yes |
| HSL | `hsl(212 100% 50%)` | Yes |
| HWB | `hwb(212 0% 0%)` | Yes |
| OKLCH | `oklch(59.7% 0.221 258)` | Yes |
| OKLab | `oklab(59.7% -0.046 -0.216)` | Yes |
| LCH | `lch(51% 77.9 280.3)` | Yes |
| Lab | `lab(51% 13.9 -76.6)` | Yes |
| HSV | `hsv(212, 100%, 100%)` | No |
| CMYK | `cmyk(100%, 53%, 0%, 0%)` | No |

LCH and Lab use the D50 white point, as CSS does. CMYK is a simple conversion from RGB, so treat it as a starting point for print work, since real printers vary.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `A` | Add the current color to the palette |
| `C` | Copy the current color in your default format |
| `R` | Pick a random color |
| Arrow keys | Move the saturation/lightness plane by 1 (hold `Shift` for 10) |

Shortcuts are ignored while you are typing in a field, and when `Ctrl`, `Cmd` or `Alt` is held.

## Getting started

Requires Node.js 16 or later.

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint and fix `.vue` and `.js` files |
| `npm test` | Run the unit and component tests (see [Testing](#testing)) |

## Testing

Tests use [Vitest](https://vitest.dev). If you haven't set it up yet:

```bash
npm install -D vitest jsdom @vue/test-utils
```

Add the script to `package.json`:

```json
"scripts": {
  "test": "vitest run"
}
```

There are two test files:

- `src/utils/color.test.js` covers the color maths: round-trips through every format, published reference values for OKLCH and Lab, parsing of every supported syntax, contrast ratios, harmonies and the shade scale.
- `src/components/ColorPicker.test.js` mounts the real components in jsdom and drives them: copying, pasting, dragging the plane, the palette (including undo and the 12-color limit), export, shortcuts, persistence, share links and contrast results.

## How it works

**HSL is the source of truth.** The current color is stored as `{ h, s, l, a }`. Every other format is derived from it on demand, and anything you paste is parsed back into HSL. Values are rounded to two decimals so a hex code survives a round trip.

**The plane is two gradients.** For a single hue, each half of the HSL saturation/lightness plane is bilinear in RGB, so two stacked CSS gradients reproduce it exactly, with no canvas needed.

**The shade scale is built in OKLCH.** Lightness steps are spaced evenly in a perceptual space, so the steps look even. Chroma is lowered as needed to stay inside the sRGB gamut without shifting the hue, and the step nearest your color's lightness is your exact color.

**Closest name uses OKLab distance.** The nearest CSS color name is found by distance in OKLab, which tracks perceived difference better than comparing RGB values.

## Saved data and sharing

The color, palette and preferences are saved in `localStorage` under the key `hsl-color-picker:v2`. Corrupt or missing data falls back to defaults, and the app still works if storage is disabled.

Share links add query parameters to the current URL:

```
?c=1e7bff&p=ff0000-00ff00-0000ff
```

`c` is the current color and `p` is the palette, as hex codes (with an alpha byte when the color is transparent) separated by hyphens. A shared link takes priority over saved data when the page loads.

## Accessibility

- Every control is reachable and operable by keyboard, with visible focus styles.
- The saturation/lightness plane is a slider with a spoken value ("Saturation 100%, lightness 50%") and responds to arrow keys.
- Text and control borders meet WCAG contrast at every hue in both light and dark themes.
- Pass and fail results use text and symbols as well as color.
- Copy confirmations, errors and undo prompts are announced through a live region.
- Animations respect `prefers-reduced-motion`.

## Tech

[Nuxt](https://nuxt.com/) (`<script setup>`), [Pinia](https://pinia.vuejs.org), [Vite](https://vitejs.dev), [tippy.js](https://atomiks.github.io/tippyjs/) for tooltips, DM Sans via [Fontsource](https://fontsource.org), and [Vitest](https://vitest.dev) for tests.

## License

MIT.
