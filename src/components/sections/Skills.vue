<script setup>
import { Code, Server, Library, Figma as FigmaIcon, Zap, Layout, Palette, Flame, Shield } from 'lucide-vue-next'
import LogoLoop from '../common/LogoLoop.vue'
import { useTheme } from '../../composables/useTheme'

const { isDark } = useTheme()

const skillCategories = [
  {
    icon: Code,
    category: "Frontend",
    skills: ["React", "Vue.js", "HTML", "CSS", "JavaScript", "TypeScript", "Tailwind CSS"]
  },
  {
    icon: Server,
    category: "Backend",
    skills: ["Supabase", "Node.js", "Express", "PostgreSQL", "Firebase"]
  },
  {
    icon: Library,
    category: "Libraries",
    skills: ["ReactBits", "shadcn/ui", "daisyUI"]
  },
  {
    icon: FigmaIcon,
    category: "UI/UX Tools",
    skills: ["Figma"]
  }
]

const techLogos = [
  { node: Zap, title: "React", href: "https://react.dev" },
  { node: Layout, title: "Next.js", href: "https://nextjs.org" },
  { node: Code, title: "TypeScript", href: "https://www.typescriptlang.org" },
  { node: Palette, title: "Tailwind", href: "https://tailwindcss.com" },
  { node: Flame, title: "Firebase", href: "https://firebase.google.com" },
  { node: Shield, title: "Supabase", href: "https://supabase.com" },
  { node: FigmaIcon, title: "Figma", href: "https://figma.com" },
  { node: Library, title: "Shadcn", href: "https://ui.shadcn.com" }
]
</script>

<template>
  <section id="skills" class="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Background Decor -->
    <div class="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
    
    <div class="container-main relative mx-auto max-w-7xl">
      <div class="mb-10 sm:mb-12 lg:mb-16 space-y-4 sm:space-y-6 max-w-2xl">
        <div class="inline-flex items-center gap-3">
          <span class="h-px w-8 bg-blue-600"></span>
          <span class="text-xs font-black uppercase tracking-[0.4em] text-blue-600">The Toolkit</span>
        </div>
        <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-main leading-[1] tracking-tighter">
          Mastering the <br /><span class="text-blue-600">Architecture.</span>
        </h2>
      </div>

      <!-- Skill Categories Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 lg:mb-20">
        <div 
          v-for="category in skillCategories" 
          :key="category.category"
          class="group p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2rem] bg-card-custom border border-main transition-all hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-xl"
        >
          <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 border border-blue-600/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
            <component :is="category.icon" :size="24" />
          </div>
          <h3 class="text-xl font-black text-main mb-4 group-hover:text-blue-600 transition-colors">{{ category.category }}</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="skill in category.skills" :key="skill" class="text-xs font-bold tracking-wide px-3 py-1.5 rounded-xl bg-card-custom border border-main text-muted shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-600 hover:text-blue-600">
              {{ skill }}
            </span>
          </div>
        </div>
      </div>

      <!-- Logo Loop -->
      <div class="relative py-12 sm:py-16 lg:py-20 rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-card-custom border border-main overflow-hidden shadow-xl">
        <div class="text-center mb-10">
          <p class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Technology Partners</p>
        </div>
        
        <LogoLoop
          :logos="techLogos"
          :speed="100"
          direction="left"
          :logoHeight="60"
          :gap="80"
          :hoverSpeed="0"
          scaleOnHover
          fadeOut
          :fadeOutColor="isDark ? '#020617' : '#f8fafc'"
        />
      </div>
    </div>
  </section>
</template>
