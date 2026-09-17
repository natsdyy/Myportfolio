<script setup>
import { ref } from 'vue'
import { Facebook, Instagram, Mail, ArrowRight } from 'lucide-vue-next'
import heroImage from '../../assets/home.png'

const emit = defineEmits(['navigate'])

const title = "IT Graduate & Tech Enthusiast"
const description = "I build modern, easy-to-use websites and applications, using AI to work smarter and turn ideas into practical digital solutions."

const coreTech = ["React", "Vue.js", "Supabase", "Figma", "shadcn/ui", "Tailwind"]

const socialLinks = [
  { icon: Facebook, label: 'Facebook', url: 'https://www.facebook.com/CharlesLouieAlvaran/' },
  { icon: Instagram, label: 'Instagram', url: 'https://www.instagram.com/natsdyyy/' },
  { icon: Mail, label: 'Email', url: 'mailto:[EMAIL_ADDRESS]' }
]

const stats = [
  { value: 'BSIT', label: 'Graduate' },
  { value: '10+', label: 'Projects' },
  { value: '2+', label: 'Years Exp' }
]
</script>

<template>
  <section id="home" class="min-h-[100svh] relative flex flex-col justify-center overflow-hidden bg-app transition-colors duration-500 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
    <!-- Background Decor (Removed for minimalism) -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
    </div>

    <div class="container-main relative z-10 mx-auto max-w-7xl">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 md:gap-12 lg:gap-20 items-center">
        <!-- Text Content -->
        <div class="space-y-6 sm:space-y-8 lg:space-y-10 text-left">
          <div class="space-y-6">
            <div class="inline-flex items-center gap-3 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 border border-main">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span class="text-[10px] sm:text-xs font-semibold tracking-wide text-muted uppercase">Available for Opportunities</span>
            </div>
            
            <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-main leading-[1.1] tracking-tight">
              Charles
              <span class="text-blue-600">Louie</span><br />
              Alvaran
            </h1>
            
            <p class="text-base sm:text-lg md:text-xl font-semibold text-slate-500 dark:text-slate-400">
              {{ title }}
            </p>
          </div>

          <p class="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {{ description }}
          </p>

          <!-- Core Tech Pills -->
          <div class="flex flex-wrap gap-2 sm:gap-3 pt-2">
            <span v-for="tech in coreTech" :key="tech" class="text-[10px] sm:text-xs font-semibold tracking-wide px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-card-custom border border-main text-muted shadow-sm transition-transform hover:-translate-y-0.5">
              {{ tech }}
            </span>
          </div>

          <!-- CTA & Socials -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4">
            <button @click="() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })" class="group relative px-6 sm:px-8 py-3 sm:py-3.5 w-full sm:w-auto font-bold tracking-wide text-sm text-white overflow-hidden rounded-xl bg-blue-600 shadow-md shadow-blue-500/10 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer">
              <span class="relative flex items-center justify-center gap-3">
                Explore Projects <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <div class="flex items-center gap-3 sm:gap-4">
              <a
                v-for="social in socialLinks"
                :key="social.label"
                :href="social.url"
                target="_blank"
                class="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-card-custom border border-main text-muted shadow-sm transition-all hover:text-main hover:-translate-y-0.5 cursor-pointer"
              >
                <component :is="social.icon" :size="20" />
              </a>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="flex items-center gap-6 sm:gap-8 lg:gap-12 pt-6 sm:pt-8 border-t border-main">
            <div v-for="stat in stats" :key="stat.label" class="space-y-1">
              <p class="text-2xl sm:text-3xl font-bold text-main">{{ stat.value }}</p>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Element -->
        <div class="relative hidden md:flex justify-end items-center w-full">
          <div class="relative group">
            <div class="relative h-[20rem] w-[20rem] lg:h-[24rem] lg:w-[24rem] rounded-[2rem] bg-card-custom p-1.5 shadow-lg transition-transform duration-500 hover:-translate-y-1">
              <img
                :src="heroImage"
                alt="Charles Louie Alvaran"
                class="h-full w-full object-cover rounded-[1.8rem] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
