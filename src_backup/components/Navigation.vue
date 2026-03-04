<script setup>
import { ref } from 'vue'
import { Menu, X } from 'lucide-vue-next'

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
  { name: 'Contact', id: 'contact' }
]

const handleNavigate = (page) => {
  emit('navigate', page)
  menuOpen.value = false
}
</script>

<template>
  <nav class="navbar bg-base-300 shadow-lg sticky top-0 z-50">
    <div class="flex-1">
      <button @click="handleNavigate('home')" class="btn btn-ghost normal-case text-2xl font-bold">
        <span class="text-blue-500">Dev</span><span class="text-blue-600">Folio</span>
      </button>
    </div>
    
    <!-- Desktop Menu -->
    <div class="flex-none gap-4 hidden md:flex">
      <button 
        v-for="item in navItems" 
        :key="item.id"
        @click="handleNavigate(item.id)"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-all duration-200',
          currentPage === item.id 
            ? 'bg-blue-500 text-white' 
            : 'text-base-content hover:bg-base-100'
        ]"
      >
        {{ item.name }}
      </button>
    </div>

    <!-- Mobile Menu Button -->
    <div class="flex-none md:hidden">
      <button 
        @click="menuOpen = !menuOpen"
        class="btn btn-ghost btn-circle"
      >
        <Menu v-if="!menuOpen" :size="24" />
        <X v-else :size="24" />
      </button>
    </div>

    <!-- Mobile Dropdown Menu -->
    <div v-if="menuOpen" class="absolute top-full left-0 right-0 bg-base-300 shadow-lg md:hidden border-t border-base-100">
      <div class="flex flex-col p-4 gap-2">
        <button 
          v-for="item in navItems" 
          :key="item.id"
          @click="handleNavigate(item.id)"
          :class="[
            'px-4 py-3 rounded-lg font-medium text-left transition-all duration-200 w-full',
            currentPage === item.id 
              ? 'bg-blue-500 text-white' 
              : 'text-base-content hover:bg-base-100'
          ]"
        >
          {{ item.name }}
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>
