<script setup>
import { ref, computed, watch } from 'vue'
import { ExternalLink, Layers, Monitor, Bot, Puzzle, ChevronLeft, ChevronRight } from 'lucide-vue-next'

import vibebuildsImg from '../../assets/Vibebuilds.png'
import dynboothImg from '../../assets/DynBooth.png'
import ismeyeImg from '../../assets/ismeye.png'
import altermatchImg from '../../assets/Altermatch.png'
import CountrysideImg from '../../assets/Countryside.png'
import figma1Img from '../../assets/Figma1.png'
import figma2Img from '../../assets/Figma2.png'
import extension1Img from '../../assets/Extension1.png'
import bot1Img from '../../assets/bot1.png'

const systemProjects = [
  {
    id: 1,
    title: "Countryside Steakhouse",
    description: "A comprehensive ERP system featuring specialized modules for finance, inventory, CRM, payroll, branches, POS, job hiring, and more.",
    tags: ["ERP", "Management", "Business"],
    image: CountrysideImg,
    link: ""
  },
  {
    id: 2,
    title: "VibeBuilds",
    description: "A high-performance PC configuration platform and community hub for tech enthusiasts, featuring real-time component validation.",
    tags: ["React TS", "Node.js", "Libraries"],
    image: vibebuildsImg,
    link: ""
  },
  {
    id: 3,
    title: "Dynbooth",
    description: "Dynamic digital photo booth ecosystem with cloud-based asset management and real-time social sharing capabilities.",
    tags: ["React TS", "Node.js", "Firebase"],
    image: dynboothImg,
    link: ""
  },
  {
    id: 4,
    title: "Ismeye",
    description: "Innovative visual identity and social networking platform designed for seamless personal branding and professional networking.",
    tags: ["React TS", "Node.js", "Firebase"],
    image: ismeyeImg,
    link: ""
  },
  {
    id: 5,
    title: "Altermatch",
    description: "Advanced competitive matching engine utilizing real-time data synchronization for high-fidelity user interactions.",
    tags: ["React TS", "Supabase", "Turbo"],
    image: altermatchImg,
    link: ""
  }
]

const figmaProjects = [
  {
    id: 6,
    title: "UI/UX Portfolio",
    description: "A collection of user interface designs and user experience workflows crafted in Figma, focusing on clean aesthetics and intuitive navigation.",
    tags: ["Figma", "UI/UX", "Design"],
    image: figma1Img,
    link: "https://www.figma.com/design/LtyIcirwyuXlYhBPF64nKh/Projects?m=auto&t=tYr81ovDXNeg53ht-6"
  },
  {
    id: 7,
    title: "College Thesis UI/UX",
    description: "Comprehensive system design and prototyping for a capstone thesis project, visualizing complex data flows and user interactions.",
    tags: ["Figma", "Prototyping", "Academic"],
    image: figma2Img,
    link: "https://www.figma.com/design/D8OJ09fuTDQPXC8AUDFdaR/THESIS?node-id=0-1&t=xDm8R7aDKAPRnPQP-1"
  }
]

const extensionProjects = [
  {
    id: 8,
    title: "Appen Highlighter Extension",
    description: "A custom browser extension designed to help coworkers easily identify products and receive guided task instructions directly within the platform, streamlining workflows and boosting efficiency.",
    tags: ["Chrome Extension", "JavaScript", "DOM API"],
    image: extension1Img,
    link: "https://appenhighlighter.vercel.app/"
  }
]

const botProjects = [
  {
    id: 9,
    title: "Discord Community Bot",
    description: "A multi-purpose Discord bot built to assist with server management, featuring interactive mini-games and automated utility tools to enhance community engagement.",
    tags: ["Discord.js", "Node.js", "Gaming"],
    image: bot1Img,
    link: ""
  }
]

const activeTab = ref('system')
const currentPage = ref(1)
const itemsPerPage = 4

const currentProjects = computed(() => {
  if (activeTab.value === 'system') return systemProjects
  if (activeTab.value === 'figma') return figmaProjects
  if (activeTab.value === 'extensions') return extensionProjects
  if (activeTab.value === 'bots') return botProjects
  return systemProjects
})

const totalPages = computed(() => Math.ceil(currentProjects.value.length / itemsPerPage) || 1)

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return currentProjects.value.slice(start, start + itemsPerPage)
})

watch(activeTab, () => {
  currentPage.value = 1
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    const el = document.getElementById('projects')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <section id="projects" class="relative py-16 sm:py-20 lg:py-24 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Background Accents (Removed) -->

    <div class="mb-10 sm:mb-12 lg:mb-16 w-full">
      <div class="container-main flex flex-col gap-6 w-full text-left">
        <div class="space-y-3 text-left">
          <div class="inline-flex items-center gap-3">
            <span class="h-px w-8 bg-blue-600"></span>
            <span class="text-xs font-semibold uppercase tracking-wide text-blue-600">The Portfolio</span>
          </div>
          <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-main tracking-tight leading-tight">
            Selected <span class="text-blue-600">Creations.</span>
          </h2>
        </div>
        
        <!-- Controls: Category Tabs on Left, Page Nav directly to its Right (Strictly Horizontal) -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <!-- Category Tabs Pill -->
          <div class="flex items-center p-1.5 rounded-2xl bg-card-custom border border-main shadow-sm gap-1 overflow-x-auto max-w-full scrollbar-hide">
            <button 
              @click="activeTab = 'system'"
              class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
              :class="activeTab === 'system' ? 'bg-blue-600 text-white shadow-md' : 'text-muted hover:text-main'"
            >
              <Monitor :size="14" :stroke-width="1.5" />
              <span>Systems</span>
            </button>
            <button 
              @click="activeTab = 'figma'"
              class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
              :class="activeTab === 'figma' ? 'bg-blue-600 text-white shadow-md' : 'text-muted hover:text-main'"
            >
              <Layers :size="14" :stroke-width="1.5" />
              <span>UI/UX</span>
            </button>
            <button 
              @click="activeTab = 'extensions'"
              class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
              :class="activeTab === 'extensions' ? 'bg-blue-600 text-white shadow-md' : 'text-muted hover:text-main'"
            >
              <Puzzle :size="14" :stroke-width="1.5" />
              <span>Extensions</span>
            </button>
            <button 
              @click="activeTab = 'bots'"
              class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
              :class="activeTab === 'bots' ? 'bg-blue-600 text-white shadow-md' : 'text-muted hover:text-main'"
            >
              <Bot :size="14" :stroke-width="1.5" />
              <span>Bots</span>
            </button>
          </div>

          <!-- Page Navigation Pill (Strictly to the Right of Tabs) -->
          <div v-if="totalPages > 1" class="flex items-center p-1.5 rounded-2xl bg-card-custom border border-main shadow-sm gap-1 flex-shrink-0">
            <button 
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="h-8 w-8 rounded-xl flex items-center justify-center text-main hover:bg-blue-600 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous Page"
            >
              <ChevronLeft :size="15" :stroke-width="1.5" />
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                class="h-8 min-w-8 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                :class="currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'text-muted hover:text-main'"
              >
                {{ page }}
              </button>
            </div>

            <button 
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="h-8 w-8 rounded-xl flex items-center justify-center text-main hover:bg-blue-600 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next Page"
            >
              <ChevronRight :size="15" :stroke-width="1.5" />
            </button>
          </div>
        </div>
      </div>
      
    </div>

    <!-- Grid Container (Max 4 items per page) -->
    <div class="container-main grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 w-full">
      <article
        v-for="(project, idx) in paginatedProjects"
        :key="project.id"
        class="group relative flex flex-col gap-6 w-full"
      >
        <div class="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-card-custom border border-main shadow-md transition-all duration-500 group-hover:shadow-lg">
          <img
            :src="project.image"
            :alt="project.title"
            class="h-full w-full object-cover transition-all duration-500 group-hover:scale-105 pointer-events-none"
            @error="(e) => e.target.src = 'https://placehold.co/800x500/f8fafc/3b82f6?text=' + project.title"
          />
          <div class="absolute inset-0 bg-white/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              class="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl cursor-pointer"
            >
              <ExternalLink :size="28" :stroke-width="1.5" />
            </a>
          </div>
        </div>

        <div class="px-1 sm:px-2 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
              Project 0{{ (currentPage - 1) * itemsPerPage + idx + 1 }}
            </span>
            <div class="flex flex-wrap gap-1.5 sm:gap-2">
              <span v-for="tech in project.tags" :key="tech" class="text-[9px] font-semibold uppercase tracking-wider px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-card-custom text-muted border border-main">
                {{ tech }}
              </span>
            </div>
          </div>
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-main group-hover:text-blue-600 transition-colors tracking-tight">{{ project.title }}</h3>
          <p class="text-sm sm:text-base text-muted leading-relaxed max-w-xl">
            {{ project.description }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
