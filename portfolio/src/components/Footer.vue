<script setup>
import { Facebook, Instagram, Mail, Phone, MapPin, ArrowUp, Sparkles, Code } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const socialLinks = [
  { icon: Facebook, label: 'Facebook', url: 'https://www.facebook.com/CharlesLouieAlvaran/' },
  { icon: Instagram, label: 'Instagram', url: 'https://www.instagram.com/natsdyyy/' },
  { icon: Mail, label: 'Email', url: 'mailto:charleslouiealvaran@gmail.com' }
]

const quickLinks = [
  { label: 'About', id: 'about' },
  { label: 'Projects', id: 'projects' },
  { label: 'Skills', id: 'skills' },
  { label: 'Contact', id: 'contact' }
]

const contactDetails = [
  { icon: Mail, label: 'Email', value: 'charleslouiealvaran@gmail.com' },
  { icon: Phone, label: 'Phone', value: '+63 929 856 8415' },
  { icon: MapPin, label: 'Based In', value: 'Dasmariñas City, Cavite, Philippines' }
]
</script>

<template>
  <footer class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-200">
    <div class="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-blue-500/20 to-transparent blur-3xl"></div>
    <div class="pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"></div>

    <div class="container-main relative flex flex-col gap-16 py-20">
      <div class="rounded-3xl border border-blue-500/20 bg-white/5 p-8 shadow-[0_25px_85px_-40px_rgba(37,99,235,0.8)] backdrop-blur-xl lg:p-12">
        <div class="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="max-w-2xl space-y-4">
            <p class="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">
              <Sparkles :size="16" /> Let’s build something together
            </p>
            <h2 class="text-3xl font-semibold leading-tight text-white lg:text-4xl">
              Ready to collaborate on your next digital experience?
            </h2>
            <p class="text-sm text-slate-300 lg:text-base">
              From concept to launch, I help teams craft interfaces that are fast, thoughtful, and scalable.
            </p>
          </div>
          <a
            href="mailto:charleslouiealvaran@gmail.com"
            class="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-blue-700"
          >
            Start a conversation
            <ArrowUp class="rotate-45" :size="18" />
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-1 shadow-lg text-blue-200">
              <Code :size="26" />
            </span>
            <div>
              <p class="text-xl font-bold text-white">
                <span class="text-blue-300">CLA</span><span class="text-blue-400">.dev</span>
              </p>
              <p class="text-xs uppercase tracking-[0.35em] text-blue-200/80">Portfolio & Playground</p>
            </div>
          </div>
          <p class="max-w-md text-sm text-slate-300">
            Showcasing the projects, processes, and ideas of Charles Louie Alvaran—student developer passionate about shipping delightful web experiences.
          </p>
          <div class="flex gap-3">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.url"
              :title="social.label"
              class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/30 bg-white/5 text-blue-200 transition hover:-translate-y-1 hover:border-blue-300 hover:text-white"
            >
              <component :is="social.icon" :size="20" />
            </a>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Navigation</h3>
          <ul class="space-y-3 text-sm text-slate-300">
            <li v-for="link in quickLinks" :key="link.id">
              <a :href="`#${link.id}`" class="transition hover:text-white">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Get in touch</h3>
          <ul class="space-y-3 text-sm text-slate-300">
            <li v-for="item in contactDetails" :key="item.label" class="flex items-start gap-3">
              <span class="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                <component :is="item.icon" :size="18" />
              </span>
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-blue-200/80">{{ item.label }}</p>
                <p class="text-sm text-slate-200">{{ item.value }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col items-center justify-between gap-4 border-t border-blue-500/20 pt-8 text-xs text-slate-400 sm:flex-row sm:text-sm">
        <p>&copy; {{ currentYear }} Charles Louie Alvaran. Crafted with Vue, Tailwind, and a love for clean experiences.</p>
        <button
          @click="scrollToTop"
          class="inline-flex items-center gap-2 rounded-full border border-blue-400/30 px-4 py-2 text-blue-200 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-white"
        >
          Back to top
          <ArrowUp :size="16" />
        </button>
      </div>
    </div>
  </footer>
</template>
