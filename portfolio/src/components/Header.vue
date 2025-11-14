<script setup>
import { ref } from 'vue'
import { Menu, X, Code } from 'lucide-vue-next'

defineProps({
  currentPage: String
})

const emit = defineEmits(['navigate'])
const menuOpen = ref(false)

const navItems = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Projects', id: 'projects' },
  { name: 'Skills', id: 'skills' },
  { name: 'Contact', id: 'contact' },
  { name: 'Login', id: 'login' }
]

const handleNavigate = (page) => {
  emit('navigate', page)
  menuOpen.value = false
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-blue-100/80 bg-white/80 backdrop-blur-xl shadow-[0_18px_45px_-35px_rgba(37,99,235,0.6)]"
  >
    <div class="container-main">
      <div class="flex items-center justify-between py-5">
        <button
          @click="handleNavigate('home')"
          class="group flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span
            class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-lg text-white"
          >
            <Code :size="28" />
          </span>
          <span class="hidden text-xl font-bold tracking-tight text-slate-900 sm:block">
            <span class="text-blue-500">CLA</span><span class="text-blue-600">.dev</span>
          </span>
        </button>

        <nav class="hidden items-center gap-1 rounded-full border border-blue-100 bg-white/70 p-1 shadow-inner md:flex">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="handleNavigate(item.id)"
            :class="[
              'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300',
              currentPage === item.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/80'
            ]"
          >
            {{ item.name }}
          </button>
        </nav>

        <div class="md:hidden">
          <button
            @click="menuOpen = !menuOpen"
            class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-blue-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Menu v-if="!menuOpen" :size="22" />
            <X v-else :size="22" />
          </button>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <div
        v-if="menuOpen"
        class="md:hidden border-t border-blue-100 bg-white/95 px-4 pb-6 shadow-lg backdrop-blur"
      >
        <div class="container-main flex flex-col gap-2 pt-4">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="handleNavigate(item.id)"
            :class="[
              'w-full rounded-2xl px-5 py-3 text-left text-base font-semibold transition-all duration-200',
              currentPage === item.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-600'
            ]"
          >
            {{ item.name }}
          </button>
        </div>
      </div>
    </transition>
  </header>
</template>
