<script setup>
const emit = defineEmits(['navigate'])

const quickLinks = [
  { label: 'About', id: 'about' },
  { label: 'Projects', id: 'projects' },
  { label: 'Skills', id: 'skills' },
  { label: 'Contact', id: 'contact' }
]

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="relative py-20 px-4 bg-app border-t border-main transition-colors duration-500 overflow-hidden">
    <!-- Subtle Background Glow -->
    <div class="absolute top-0 right-0 w-[30rem] h-[30rem] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>

    <div class="container-main relative">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] gap-16 items-start">
        <!-- Brand Side -->
        <div class="space-y-8">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <span class="font-black text-xl">C</span>
            </div>
            <span class="text-xl font-black tracking-widest text-main">CLA.DEV</span>
          </div>
          <p class="text-muted font-medium max-w-sm leading-relaxed">
            A passionate IT Graduate focused on creating high-impact digital experiences. Building the future, one pixel at a time.
          </p>
        </div>

        <!-- Links Side -->
        <div class="space-y-8">
          <p class="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Explore</p>
          <div class="flex flex-col gap-4">
            <button
              v-for="link in quickLinks"
              :key="link.id"
              @click="emit('navigate', link.id)"
              class="text-left text-lg font-bold text-muted hover:text-blue-600 transition-colors cursor-pointer"
            >
              {{ link.label }}
            </button>
          </div>
        </div>

        <!-- CTA Side -->
        <div class="space-y-8">
          <p class="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Connect</p>
          <div class="space-y-6">
            <h4 class="text-2xl font-black text-main tracking-tighter">Have a project in mind?</h4>
            <button 
              @click="emit('navigate', 'contact')"
              class="group flex items-center gap-4 text-blue-600 font-black uppercase tracking-widest text-xs hover:gap-6 transition-all cursor-pointer"
            >
              Get in touch <span class="h-px w-8 bg-blue-600 transition-all group-hover:w-12"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="mt-20 pt-10 border-t border-main flex flex-col sm:flex-row items-center justify-between gap-6">
        <p class="text-[10px] font-bold uppercase tracking-widest text-muted">
          © 2026 Charles Louie Alvaran. All Rights Reserved.
        </p>
        <button 
          @click="scrollToTop"
          class="text-[10px] font-black uppercase tracking-widest text-main hover:text-blue-600 transition-colors cursor-pointer"
        >
          Back to Top ↑
        </button>
      </div>
    </div>
  </footer>
</template>
