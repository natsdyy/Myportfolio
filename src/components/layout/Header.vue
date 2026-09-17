<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Sun, Moon, X } from 'lucide-vue-next'
import { useTheme } from '../../composables/useTheme'

const props = defineProps({
  currentPage: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['navigate'])

const { isDark, toggleTheme } = useTheme()
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const activeSection = ref('home')

const navItems = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Projects', id: 'projects' },
  { label: 'Skills', id: 'skills' },
  { label: 'Contact', id: 'contact' }
]

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
  
  if (props.currentPage !== 'home') return
  
  const sections = navItems.map(item => document.getElementById(item.id)).filter(Boolean)
  let current = 'home'
  for (const section of sections) {
    const rect = section.getBoundingClientRect()
    if (rect.top <= 150) {
      current = section.id
    }
  }
  activeSection.value = current
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }
}

const navigate = (id) => {
  const isSection = navItems.some(item => item.id === id)
  
  if (isSection) {
    activeSection.value = id
    if (props.currentPage !== 'home') {
      emit('navigate', 'home')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  } else {
    emit('navigate', id)
  }
  
  if (isMobileMenuOpen.value) toggleMobileMenu()
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header 
    :class="[
      'fixed top-0 left-0 z-[100] transition-all duration-500',
      'w-full md:w-64 md:h-screen',
      'md:border-r border-main bg-app'
    ]"
  >
    <!-- Desktop Sidebar -->
    <div class="hidden md:flex flex-col h-full py-10 xl:py-12 px-6 overflow-y-auto">
      <!-- Logo Section -->
      <div 
        class="flex items-center gap-4 mb-16 cursor-pointer group"
        @click="navigate('home')"
      >
        <div class="relative h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center transition-transform group-hover:scale-105 shadow-md shadow-blue-600/20">
          <span class="text-white font-bold text-xl tracking-tight">C</span>
        </div>
        <div class="flex flex-col">
          <span class="text-base font-bold tracking-wide text-main uppercase">CLA.DEV</span>
          <span class="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Portfolio</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 flex flex-col gap-2">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="navigate(item.id)"
          :class="[
            'flex items-center px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 rounded-xl cursor-pointer w-full text-left',
            activeSection === item.id && props.currentPage === 'home'
              ? 'bg-blue-600/10 text-blue-600' 
              : 'text-muted hover:text-main hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
          ]"
        >
          <span :class="['w-1.5 h-1.5 rounded-full mr-3 transition-colors', activeSection === item.id && props.currentPage === 'home' ? 'bg-blue-600' : 'bg-transparent']"></span>
          {{ item.label }}
        </button>
      </nav>

      <!-- Bottom Actions -->
      <div class="mt-8 flex flex-col gap-6">
        <div class="flex items-center justify-between px-2">
          <span class="text-xs font-semibold uppercase tracking-wide text-muted">Theme</span>
          <button 
            @click="toggleTheme"
            class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-muted hover:text-blue-600 border border-main transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>
        </div>
        
        <button 
          @click="navigate('contact')"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          Hire Me
        </button>
      </div>
    </div>

    <!-- Mobile Topbar -->
    <div 
      :class="[
        'md:hidden flex items-center justify-between px-4 py-3 transition-all duration-500 backdrop-blur-2xl border-b border-main',
        isScrolled ? 'bg-header-custom shadow-sm' : 'bg-transparent border-transparent'
      ]"
    >
      <div class="flex items-center gap-2 group cursor-pointer" @click="navigate('home')">
        <div class="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span class="text-white font-bold text-sm">C</span>
        </div>
        <span class="text-xs font-bold tracking-wide text-main uppercase">CLA.DEV</span>
      </div>

      <div class="flex items-center gap-4">
        <button @click="toggleTheme" class="text-muted hover:text-main">
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <button @click="toggleMobileMenu" class="text-main p-1">
          <div class="flex flex-col items-end gap-1.5 w-6">
            <span class="h-0.5 bg-current transition-all transform duration-300 w-full" :class="isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''"></span>
            <span class="h-0.5 bg-current transition-all transform duration-300 w-4" :class="isMobileMenuOpen ? 'opacity-0' : ''"></span>
            <span class="h-0.5 bg-current transition-all transform duration-300 w-full" :class="isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''"></span>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <Transition name="fade">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[110] bg-app md:hidden">
        <div class="flex flex-col h-full p-6 pt-24">
          <div class="space-y-6">
            <button
              v-for="(item, index) in navItems"
              :key="item.id"
              @click="navigate(item.id)"
              :class="[
                'block w-full text-left text-3xl font-bold tracking-tight transition-colors cursor-pointer',
                activeSection === item.id && props.currentPage === 'home'
                  ? 'text-blue-600'
                  : 'text-muted hover:text-main'
              ]"
              :style="{ transitionDelay: `${index * 50}ms` }"
            >
              {{ item.label }}
            </button>
          </div>
          
          <button 
            @click="toggleMobileMenu"
            class="absolute top-4 right-4 h-12 w-12 flex items-center justify-center rounded-2xl bg-card-custom border border-main text-main transition-all hover:rotate-90 cursor-pointer"
          >
            <X :size="24" />
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.6s cubic-bezier(0.85, 0, 0.15, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; clip-path: circle(0% at 100% 0%); }
.fade-enter-to, .fade-leave-from { opacity: 1; clip-path: circle(150% at 100% 0%); }
</style>
