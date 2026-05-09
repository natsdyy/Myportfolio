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
  <section class="relative py-32 px-4 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Background Decor -->
    <div class="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
    
    <div class="container-main relative">
      <div class="mb-20 text-center space-y-6">
        <p class="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600">The Toolkit</p>
        <h2 class="text-5xl lg:text-7xl font-black text-main leading-tight tracking-tighter">
          Mastering the <br /><span class="text-blue-600">Architecture.</span>
        </h2>
      </div>

      <!-- Skill Categories Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        <div 
          v-for="category in skillCategories" 
          :key="category.category"
          class="group p-8 rounded-[2rem] bg-card-custom border border-main transition-all hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-xl"
        >
          <div class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50/50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <component :is="category.icon" :size="28" />
          </div>
          <h3 class="text-xl font-black text-main mb-4">{{ category.category }}</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="skill in category.skills" :key="skill" class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-50/50 text-muted border border-main group-hover:border-slate-200">
              {{ skill }}
            </span>
          </div>
        </div>
      </div>

      <!-- Logo Loop -->
      <div class="relative py-20 rounded-[3rem] bg-card-custom border border-main overflow-hidden shadow-xl">
        <div class="text-center mb-10">
          <p class="text-[10px] font-black uppercase tracking-[0.4em] text-muted">Technology Partners</p>
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
