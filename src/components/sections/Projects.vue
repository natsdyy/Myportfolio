<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ExternalLink, ArrowLeft, ArrowRight } from 'lucide-vue-next'

import vibebuildsImg from '../../assets/Vibebuilds.png'
import dynboothImg from '../../assets/DynBooth.png'
import ismeyeImg from '../../assets/ismeye.png'
import altermatchImg from '../../assets/Altermatch.png'

const projects = [
  {
    id: 1,
    title: "Countryside Steakhouse",
    description: "A comprehensive ERP system featuring specialized modules for finance, inventory, CRM, payroll, branches, POS, job hiring, and more.",
    tags: ["ERP", "Management", "Business"],
    image: "https://www.countryside-steakhouse.site/assets/img/aboutus.png",
    link: "https://www.countryside-steakhouse.site/"
  },
  {
    id: 2,
    title: "VibeBuilds",
    description: "A high-performance PC configuration platform and community hub for tech enthusiasts, featuring real-time component validation.",
    tags: ["React TS", "Node.js", "Libraries"],
    image: vibebuildsImg,
    link: "https://www.vibebuilds.site"
  },
  {
    id: 3,
    title: "Dynbooth",
    description: "Dynamic digital photo booth ecosystem with cloud-based asset management and real-time social sharing capabilities.",
    tags: ["React TS", "Node.js", "Firebase"],
    image: dynboothImg,
    link: "https://dynbooth.vercel.app"
  },
  {
    id: 4,
    title: "Ismeye",
    description: "Innovative visual identity and social networking platform designed for seamless personal branding and professional networking.",
    tags: ["React TS", "Node.js", "Firebase"],
    image: ismeyeImg,
    link: "https://www.ismeye.site"
  },
  {
    id: 5,
    title: "Altermatch",
    description: "Advanced competitive matching engine utilizing real-time data synchronization for high-fidelity user interactions.",
    tags: ["React TS", "Supabase", "Turbo"],
    image: altermatchImg,
    link: "https://altermatch.vercel.app"
  }
]

// Extended list for seamless loop
const displayProjects = computed(() => [...projects, ...projects, ...projects])

const scrollContainer = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const animationId = ref(null)
const isHovered = ref(false)

const startDragging = (e) => {
  isDragging.value = true
  startX.value = (e.pageX || e.touches[0].pageX) - scrollContainer.value.offsetLeft
  scrollLeft.value = scrollContainer.value.scrollLeft
  cancelAnimationFrame(animationId.value)
}

const stopDragging = () => {
  isDragging.value = false
  if (!isHovered.value) startAutoScroll()
}

const move = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const x = (e.pageX || e.touches[0].pageX) - scrollContainer.value.offsetLeft
  const walk = (x - startX.value) * 1.5
  scrollContainer.value.scrollLeft = scrollLeft.value - walk
  
  // Infinite loop logic for dragging
  const container = scrollContainer.value
  const maxScroll = container.scrollWidth / 3
  if (container.scrollLeft <= 0) {
    container.scrollLeft = maxScroll
    startX.value = x
    scrollLeft.value = container.scrollLeft
  } else if (container.scrollLeft >= maxScroll * 2) {
    container.scrollLeft = maxScroll
    startX.value = x
    scrollLeft.value = container.scrollLeft
  }
}

const startAutoScroll = () => {
  const scroll = () => {
    if (!isDragging.value && !isHovered.value && scrollContainer.value) {
      scrollContainer.value.scrollLeft += 0.5 
      const maxScroll = scrollContainer.value.scrollWidth / 3
      if (scrollContainer.value.scrollLeft >= maxScroll * 2) {
        scrollContainer.value.scrollLeft = maxScroll
      }
    }
    animationId.value = requestAnimationFrame(scroll)
  }
  animationId.value = requestAnimationFrame(scroll)
}

const navScroll = (direction) => {
  const amount = 450
  scrollContainer.value.scrollBy({
    left: direction === 'left' ? -amount : amount,
    behavior: 'smooth'
  })
}

onMounted(() => {
  setTimeout(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollLeft = scrollContainer.value.scrollWidth / 3
      startAutoScroll()
    }
  }, 100)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId.value)
})
</script>

<template>
  <section class="relative py-32 px-0 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Background Accents -->
    <div class="absolute top-0 right-0 w-[50rem] h-[50rem] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none"></div>

    <div class="px-4 mb-16">
      <div class="container-main flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-3">
            <span class="h-px w-8 bg-blue-600"></span>
            <span class="text-xs font-black uppercase tracking-[0.4em] text-blue-600">The Portfolio</span>
          </div>
          <h2 class="text-5xl lg:text-7xl font-black text-main leading-[1] tracking-tighter">
            Selected <br /><span class="text-blue-600">Creations.</span>
          </h2>
        </div>
        
        <div class="flex gap-4">
          <button 
            @click="navScroll('left')"
            class="h-14 w-14 rounded-2xl border border-main bg-card-custom flex items-center justify-center text-main hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft :size="20" />
          </button>
          <button 
            @click="navScroll('right')"
            class="h-14 w-14 rounded-2xl border border-main bg-card-custom flex items-center justify-center text-main hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <ArrowRight :size="20" />
          </button>
        </div>
      </div>
    </div>

    <!-- Draggable Container -->
    <div 
      ref="scrollContainer"
      class="flex gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing py-10"
      @mousedown="startDragging"
      @mousemove="move"
      @mouseup="stopDragging"
      @touchstart="startDragging"
      @touchmove="move"
      @touchend="stopDragging"
      @mouseenter="isHovered = true"
      @mouseleave="() => { stopDragging(); isHovered = false; }"
    >
      <article
        v-for="(project, idx) in displayProjects"
        :key="`${project.id}-${idx}`"
        class="flex-shrink-0 w-[85vw] md:w-[600px] group relative flex flex-col gap-8 select-none first:ml-4"
      >
        <div class="relative aspect-[16/10] w-full overflow-hidden rounded-[3rem] bg-card-custom border border-main shadow-xl transition-all duration-700 group-hover:shadow-blue-600/10 group-hover:border-blue-600/40">
          <img
            :src="project.image"
            :alt="project.title"
            class="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105 pointer-events-none"
            @error="(e) => e.target.src = 'https://placehold.co/800x500/f8fafc/3b82f6?text=' + project.title"
          />
          <div class="absolute inset-0 bg-white/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              class="h-20 w-20 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-2xl cursor-pointer"
            >
              <ExternalLink :size="32" />
            </a>
          </div>
        </div>

        <div class="px-6 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Project 0{{ (idx % projects.length) + 1 }}</span>
            <div class="flex gap-2">
              <span v-for="tech in project.tags" :key="tech" class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-card-custom text-muted border border-main">
                {{ tech }}
              </span>
            </div>
          </div>
          <h3 class="text-4xl font-black text-main group-hover:text-blue-600 transition-colors tracking-tighter">{{ project.title }}</h3>
          <p class="text-lg text-muted font-medium leading-relaxed line-clamp-2 max-w-xl">
            {{ project.description }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
