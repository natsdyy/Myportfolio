<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'
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

const navItems = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Projects', id: 'projects' },
  { label: 'Skills', id: 'skills' },
  { label: 'Contact', id: 'contact' }
]

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
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
  emit('navigate', id)
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
      'fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4',
      isScrolled ? 'pt-2 md:pt-4' : 'pt-3 md:pt-6'
    ]"
  >
    <nav class="mx-auto max-w-5xl">
      <!-- Premium Glass Island -->
      <div 
        :class="[
          'relative flex items-center justify-between px-4 py-3 md:px-6 md:py-4 rounded-3xl transition-all duration-500 backdrop-blur-2xl border border-main',
          isScrolled 
            ? 'bg-header-custom shadow-[0_8px_32px_rgba(0,0,0,0.05)]' 
            : 'bg-header-custom shadow-sm'
        ]"
      >
        <!-- Logo Section -->
        <div 
          class="flex items-center gap-2 md:gap-3 group cursor-pointer"
          @click="navigate('home')"
        >
          <div class="relative h-10 w-10 overflow-hidden rounded-xl bg-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
            <span class="text-white font-black text-xl tracking-tighter">C</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs md:text-sm font-black tracking-[0.15em] md:tracking-[0.2em] text-main uppercase">CLA.DEV</span>
            <span class="hidden md:block text-[9px] font-bold text-blue-600 uppercase tracking-widest">Portfolio</span>
          </div>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-1">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="navigate(item.id)"
            :class="[
              'px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-xl cursor-pointer',
              currentPage === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-muted hover:text-main hover:bg-slate-100/50'
            ]"
          >
            {{ item.label }}
          </button>
        </div>

        <!-- Action Button -->
        <div class="flex items-center gap-2">
          <!-- Theme Toggle -->
          <button 
            @click="toggleTheme"
            class="h-10 w-10 flex items-center justify-center rounded-xl border border-main bg-card-custom text-muted hover:text-blue-600 transition-all cursor-pointer"
          >
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>

          <button 
            @click="navigate('contact')"
            class="hidden md:block px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10 cursor-pointer ml-2"
          >
            Hire Me
          </button>

          <!-- Mobile Toggle -->
          <button 
            @click="toggleMobileMenu"
            class="md:hidden flex flex-col gap-1.5 p-2 group cursor-pointer"
          >
            <span class="h-0.5 w-6 bg-slate-900 dark:bg-white transition-all" :class="isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''"></span>
            <span class="h-0.5 w-6 bg-slate-900 dark:bg-white transition-all" :class="isMobileMenuOpen ? 'opacity-0' : ''"></span>
            <span class="h-0.5 w-6 bg-slate-900 dark:bg-white transition-all" :class="isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''"></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <Transition name="fade">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[110] bg-app md:hidden">
        <div class="flex flex-col h-full p-10 pt-32">
          <div class="space-y-8">
            <button
              v-for="(item, index) in navItems"
              :key="item.id"
              @click="navigate(item.id)"
              class="block w-full text-left text-5xl font-black tracking-tighter text-muted hover:text-blue-600 transition-colors cursor-pointer"
              :style="{ transitionDelay: `${index * 50}ms` }"
            >
              {{ item.label }}
            </button>
          </div>
          

          <button 
            @click="toggleMobileMenu"
            class="absolute top-10 right-10 h-16 w-16 flex items-center justify-center rounded-full bg-card-custom text-main font-black cursor-pointer"
          >
            CLOSE
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
