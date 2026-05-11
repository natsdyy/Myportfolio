<script setup>
import { ref } from 'vue'
import { Facebook, Instagram, Mail, ArrowRight } from 'lucide-vue-next'
import heroImage from '../../assets/profile.png'

const emit = defineEmits(['navigate'])

const title = "IT Graduate & Tech Enthusiast"
const description = "Crafting high-performance digital experiences with modern web technologies. Specializing in full-stack development and user-centric design."

const coreTech = ["React", "Vue.js", "Supabase", "Figma", "shadcn/ui", "Tailwind"]

const socialLinks = [
  { icon: Facebook, label: 'Facebook', url: 'https://www.facebook.com/CharlesLouieAlvaran/' },
  { icon: Instagram, label: 'Instagram', url: 'https://www.instagram.com/natsdyyy/' },
  { icon: Mail, label: 'Email', url: 'mailto:charleslouiealvaran@gmail.com' }
]

const stats = [
  { value: 'BS', label: 'Graduate' },
  { value: '20+', label: 'Projects' },
  { value: '3+', label: 'Years Exp' }
]
</script>

<template>
  <section class="min-h-[100svh] relative flex items-center justify-center overflow-hidden bg-app transition-colors duration-500 px-4 pt-20 pb-16">
    <!-- Background Decor -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-[10%] -left-[10%] h-[40rem] w-[40rem] rounded-full bg-blue-600/5 blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[10%] -right-[10%] h-[35rem] w-[35rem] rounded-full bg-indigo-600/5 blur-[100px] animate-pulse-slow"></div>
    </div>

    <div class="container-main relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
        <!-- Text Content -->
        <div class="space-y-10 text-left">
          <div class="space-y-4">
            <div class="inline-flex items-center gap-2 rounded-full border border-blue-500/10 bg-card-custom px-4 py-1.5 shadow-sm">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Available for Opportunities</span>
            </div>
            
            <h1 class="text-6xl lg:text-7xl xl:text-8xl font-black text-main leading-[0.9] tracking-tighter">
              Charles<span class="text-blue-600"> Louie</span><br />
              Alvaran
            </h1>
            
            <div class="h-12 flex items-center">
              <p class="text-xl lg:text-2xl font-bold text-muted tracking-tight">
                {{ title }}
              </p>
            </div>
          </div>

          <p class="text-lg text-muted max-w-xl leading-relaxed font-medium">
            {{ description }}
          </p>

          <!-- Core Tech Pills -->
          <div class="flex flex-wrap gap-2 pt-2">
            <span v-for="tech in coreTech" :key="tech" class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-card-custom border border-main text-muted transition-all hover:border-blue-600 hover:text-blue-600">
              {{ tech }}
            </span>
          </div>

          <!-- CTA & Socials -->
          <div class="flex flex-col sm:flex-row items-center gap-6 pt-4">
            <button @click="emit('navigate', 'projects')" class="group relative px-8 py-4 w-full sm:w-auto font-black uppercase tracking-widest text-xs text-white overflow-hidden rounded-2xl bg-blue-600 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-500 group-hover:scale-110"></div>
              <span class="relative flex items-center justify-center gap-3">
                Explore Projects <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <div class="flex items-center gap-4">
              <a
                v-for="social in socialLinks"
                :key="social.label"
                :href="social.url"
                target="_blank"
                class="flex h-12 w-12 items-center justify-center rounded-2xl border border-main bg-card-custom text-muted transition-all hover:border-blue-600 hover:text-blue-600 hover:-translate-y-1 cursor-pointer shadow-sm"
              >
                <component :is="social.icon" :size="20" />
              </a>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-10 border-t border-main">
            <div v-for="stat in stats" :key="stat.label" class="space-y-1">
              <p class="text-3xl font-black text-main">{{ stat.value }}</p>
              <p class="text-[10px] font-bold uppercase tracking-widest text-muted">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Element -->
        <div class="relative hidden lg:flex justify-center items-center">
          <div class="relative group">
            <div class="absolute -inset-4 rounded-[3rem] bg-blue-600/5 opacity-50 blur-2xl group-hover:opacity-100 transition-opacity"></div>
            <div class="relative h-[32rem] w-[26rem] rounded-[2.5rem] border border-main bg-card-custom p-2 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-rotate-2">
              <img
                :src="heroImage"
                alt="Charles Louie Alvaran"
                class="h-full w-full object-cover rounded-[2rem] grayscale-[0.2] contrast-[1.05] transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div class="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              <div class="absolute bottom-8 left-8 right-8">
                <p class="text-sm font-black uppercase tracking-[0.4em] text-blue-600 mb-1">Based in</p>
                <p class="text-xl font-bold text-main">Dasmariñas, Cavite</p>
              </div>
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
