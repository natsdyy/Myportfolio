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
  <section id="home" class="relative flex flex-col justify-center overflow-hidden bg-app transition-colors duration-500 py-6 sm:py-10 lg:py-12">
    <!-- Background Decor (Removed for minimalism) -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
    </div>

    <div class="container-main relative z-10 w-full">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center w-full">
        <!-- Text Content -->
        <div class="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
          <div class="space-y-5 sm:space-y-6">
            
            
            <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-main leading-[1.08] tracking-tight">
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
          <div class="flex flex-wrap gap-2 sm:gap-2.5 pt-1">
            <span v-for="tech in coreTech" :key="tech" class="text-[10px] sm:text-xs font-semibold tracking-wide px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-card-custom border border-main text-muted shadow-sm transition-transform hover:-translate-y-0.5">
              {{ tech }}
            </span>
          </div>

          <!-- CTA & Socials -->
          <div class="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
            <button @click="() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })" class="group relative px-6 sm:px-8 py-3 sm:py-3.5 font-bold tracking-wide text-sm text-white overflow-hidden rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
              <span class="relative flex items-center justify-center gap-3">
                Explore Projects <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <div class="flex items-center gap-3">
              <a
                v-for="social in socialLinks"
                :key="social.label"
                :href="social.url"
                target="_blank"
                class="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-card-custom border border-main text-muted shadow-sm transition-all hover:text-main hover:border-blue-600/30 hover:-translate-y-0.5 cursor-pointer"
              >
                <component :is="social.icon" :size="18" />
              </a>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="flex items-center gap-6 sm:gap-8 lg:gap-12 pt-6 sm:pt-8 border-t border-main">
            <div v-for="stat in stats" :key="stat.label" class="space-y-1">
              <p class="text-2xl sm:text-3xl lg:text-4xl font-bold text-main">{{ stat.value }}</p>
              <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Element (Responsive on both desktop & mobile) -->
        <div class="lg:col-span-5 flex justify-center lg:justify-end items-center w-full mt-4 lg:mt-0">
          <div class="relative w-full max-w-sm sm:max-w-md lg:max-w-full">
            <div class="relative w-full aspect-[4/3] rounded-3xl lg:rounded-[2.5rem] bg-card-custom p-2 sm:p-2.5 shadow-xl border border-main transition-transform duration-500 hover:-translate-y-1 overflow-hidden">
              <img
                :src="heroImage"
                alt="Charles Louie Alvaran"
                class="h-full w-full object-cover rounded-2xl lg:rounded-[2rem] transition-transform duration-500"
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
