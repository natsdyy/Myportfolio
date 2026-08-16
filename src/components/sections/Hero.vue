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
  <section id="home" class="min-h-[100svh] relative flex flex-col justify-center overflow-hidden bg-app transition-colors duration-500 px-4 pt-32 pb-20">
    <!-- Background Decor -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute top-0 right-1/4 h-[40rem] w-[40rem] rounded-full bg-blue-600/5 blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-0 left-1/4 h-[40rem] w-[40rem] rounded-full bg-indigo-600/5 blur-[120px] animate-pulse-slow"></div>
    </div>

    <div class="container-main relative z-10 mx-auto max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
        <!-- Text Content -->
        <div class="space-y-10 text-left">
          <div class="space-y-6">
            <div class="inline-flex items-center gap-3 rounded-full bg-blue-500/10 px-4 py-2 border border-blue-500/20">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span class="text-xs font-bold tracking-widest text-blue-600 uppercase">Available for Opportunities</span>
            </div>
            
            <h1 class="text-6xl md:text-7xl xl:text-[6rem] font-black text-main leading-[0.85] tracking-tighter">
              Charles
              <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Louie</span><br />
              Alvaran
            </h1>
            
            <p class="text-xl md:text-2xl font-bold text-slate-400 dark:text-slate-300 tracking-tight">
              {{ title }}
            </p>
          </div>

          <p class="text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {{ description }}
          </p>

          <!-- Core Tech Pills -->
          <div class="flex flex-wrap gap-3 pt-2">
            <span v-for="tech in coreTech" :key="tech" class="text-xs font-bold tracking-wide px-4 py-2 rounded-xl bg-card-custom border border-main text-muted shadow-sm transition-transform hover:-translate-y-0.5 hover:border-blue-600 hover:text-blue-600">
              {{ tech }}
            </span>
          </div>

          <!-- CTA & Socials -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4">
            <button @click="() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })" class="group relative px-8 py-4 w-full sm:w-auto font-black uppercase tracking-widest text-xs text-white overflow-hidden rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-500 group-hover:scale-110"></div>
              <span class="relative flex items-center gap-3">
                Explore Projects <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <div class="flex items-center gap-4">
              <a
                v-for="social in socialLinks"
                :key="social.label"
                :href="social.url"
                target="_blank"
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-custom border border-main text-muted shadow-sm transition-all hover:border-blue-600 hover:text-blue-600 hover:-translate-y-1 cursor-pointer"
              >
                <component :is="social.icon" :size="20" />
              </a>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="flex items-center gap-12 pt-10 border-t border-slate-200 dark:border-slate-800">
            <div v-for="stat in stats" :key="stat.label" class="space-y-1">
              <p class="text-4xl font-black text-main">{{ stat.value }}</p>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Element -->
        <div class="relative hidden lg:flex justify-end items-center w-full">
          <div class="relative group">
            <div class="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 opacity-50 blur-2xl group-hover:opacity-100 transition-opacity duration-700"></div>
            <div class="relative h-[36rem] w-[36rem] rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 bg-card-custom p-2 overflow-hidden shadow-2xl transition-transform duration-700 group-hover:-rotate-1">
              <img
                :src="heroImage"
                alt="Charles Louie Alvaran"
                class="h-full w-full object-cover rounded-[2rem] grayscale-[0.1] contrast-[1.02] transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.animate-pulse-slow {
  animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.1); }
}
</style>
