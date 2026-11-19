<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Color Picker | Japodhi'
const description = 'A multi-featured web app that helps you pick colours.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png'
})

const items: NavigationMenuItem[] = [
  {
    label: 'LinkedIn',
    to: 'https://www.linkedin.com/in/finch-ochieng/',
    target: '_blank'
  },
  {
    label: 'Github',
    to: 'https://github.com/japodhidev/',
    target: '_blank'
  }
]
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="text-xl font-bold focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
        >
          Color Picker
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          to="https://github.com/japodhidev"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Built using Nuxt UI • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <UNavigationMenu
        :items="items"
        variant="link"
      />
    </UFooter>
  </UApp>
</template>
