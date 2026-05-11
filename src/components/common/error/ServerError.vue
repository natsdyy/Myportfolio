<script setup>
import { RefreshCcw, Home, AlertTriangle } from 'lucide-vue-next'

defineEmits(['navigate'])

const reloadPage = () => {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-app overflow-hidden relative">
    <!-- Background Accents (Red/Orange for Error) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-red-600/5 blur-[150px] rounded-full pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/5 blur-[100px] rounded-full pointer-events-none"></div>

    <div class="max-w-2xl w-full text-center space-y-12 relative z-10">
      <div class="flex justify-center">
        <div class="h-24 w-24 rounded-3xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 shadow-2xl shadow-red-600/10 animate-pulse">
          <AlertTriangle :size="48" />
        </div>
      </div>

      <div class="space-y-6">
        <div class="relative inline-block">
          <h1 class="text-7xl md:text-9xl font-black text-main tracking-tighter">500</h1>
          <div class="h-1.5 w-full bg-red-600 rounded-full absolute -bottom-2 left-0"></div>
        </div>
        <h2 class="text-3xl md:text-5xl font-black text-main tracking-tight pt-4">Server Hiccup.</h2>
        <p class="text-lg text-muted font-medium max-w-lg mx-auto leading-relaxed">
          Something went wrong on our end. Our technical spirits are working hard to restore order. Please try refreshing the page.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          @click="reloadPage"
          class="group px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-red-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-600/20 cursor-pointer"
        >
          <RefreshCcw :size="18" class="group-hover:rotate-180 transition-transform duration-500" />
          Retry Request
        </button>
        <button 
          @click="$emit('navigate', 'home')"
          class="px-8 py-4 bg-card-custom border border-main text-main rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Home :size="18" />
          Take me Home
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add a subtle glitch effect to the 500 number */
h1 {
  text-shadow: 2px 2px 0px rgba(220, 38, 38, 0.2);
}
</style>
