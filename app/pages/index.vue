<script setup>
const features = ref([
  {
    title: 'Ten formats, one click',
    description: 'HEX, RGB, HSL, HWB, OKLCH, OKLab, LCH, Lab, HSV and CMYK. Select any value to copy it, or set a default format and syntax for everything you copy.'
  },
  {
    title: 'Paste anything',
    description: 'Type or paste a hex code, an rgb() or hsl() value, an OKLCH color or a CSS name like rebeccapurple, and the controls jump straight to it.'
  },
  {
    title: 'Check contrast',
    description: 'See the WCAG contrast ratio of your color with white and black text, and whether it passes AA and AAA.'
  },
  {
    title: 'Find matching colors',
    description: 'Generate complementary, analogous, triadic, split complementary and tetradic schemes, plus an 11-step shade scale built in OKLCH.'
  },
  {
    title: 'Keep a palette',
    description: 'Save up to 12 colors. They stay in your browser between visits. Export them as CSS variables, SCSS, JSON or Tailwind.'
  },
  {
    title: 'Share your work',
    description: 'Copy a link that opens the same color and palette on any device.'
  }
])
const guides = ref([
  { format: 'HEX', text: 'Short and understood everywhere. A safe default for CSS and design handoff.' },
  { format: 'RGB', text: 'Red, green and blue channels. Handy in canvas, image and JavaScript work.' },
  { format: 'HSL', text: 'Hue, saturation and lightness. Easy to adjust by hand, so it suits hover states and themes.' },
  { format: 'OKLCH', text: 'Like HSL, but equal changes in lightness look equal to the eye. A good base for accessible color scales.' },
  { format: 'HSV', text: 'The model behind many design-tool pickers, where 100% value is the brightest version of a hue.' },
  { format: 'CMYK', text: 'Ink percentages for print. Treat the numbers as a starting point, since printers vary.' }
])

const shortcuts = ref([
  { key: 'A', text: 'Add the current color to the palette' },
  { key: 'C', text: 'Copy the current color in your default format' },
  { key: 'R', text: 'Pick a random color' }
])
</script>

<template>
  <div>
    <UPageHero
      title="Color Picker"
      description="Build a color with hue, saturation and lightness, or paste one you already have. The picker converts it to ten formats, checks its contrast, suggests matching colors and keeps a palette you can export as code."
      :links="[{
        label: 'Get started',
        to: '/picker',
        trailingIcon: 'i-lucide-arrow-right',
        size: 'xl'
      }, {
        label: 'About Me',
        to: 'https://www.linkedin.com/in/finch-ochieng/',
        target: '_blank',
        icon: 'i-simple-icons-linkedin',
        size: 'xl',
        color: 'neutral',
        variant: 'subtle'
      }]"
    />
    <UPageSection
      id="features"
      title="Pick a color once, use it in any format"
      description="Start with a solid foundation. This template includes all the essentials for building production-ready applications with Nuxt UI's powerful component system."
    >
      <div class="flex flex-wrap gap-4">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="max-w-sm"
        >
          <UPageCard
            :title="feature.title"
            :description="feature.description"
            variant="outline"
          />
        </div>
      </div>
    </UPageSection>

    <UPageSection>
      <div class="grid md:grid-cols-2 gap-3">
        <UCard
          title="Which format should I use?"
          variant="soft"
        >
          <UPageList>
            <div
              v-for="(guide, index) in guides"
              :key="index"
              class="grid grid-cols-5 md:grid-cols-6 mb-2 py-3 border-gray-200 border-b-1"
            >
              <div>
                <UBadge variant="subtle">
                  {{ guide.format }}
                </UBadge>
              </div>
              <div class="col-span-4 md:col-span-5">
                <p>{{ guide.text }}</p>
              </div>
            </div>
          </UPageList>
        </UCard>
        <UCard
          title="Keyboard shortcuts"
          variant="soft"
        >
          <UPageList>
            <div
              v-for="(shortcut, index) in shortcuts"
              :key="index"
              class="inline-flex gap-8 place-items-center mb-2 py-3"
            >
              <UBadge variant="soft">
                {{ shortcut.key }}
              </UBadge>
              <p>{{ shortcut.text }}</p>
            </div>
          </UPageList>
        </UCard>
      </div>
    </UPageSection>
  </div>
</template>
