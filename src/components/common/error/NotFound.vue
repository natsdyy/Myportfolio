<script setup>
import { MoveLeft, Home } from 'lucide-vue-next'

defineEmits(['navigate'])
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-app overflow-hidden relative">
    <!-- Background Accents -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none"></div>
    <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none"></div>

    <div class="max-w-2xl w-full text-center space-y-12 relative z-10">
      <div class="relative inline-block">
        <h1 class="text-[12rem] md:text-[18rem] font-black text-main leading-none tracking-tighter opacity-10 select-none">
          404
        </h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-4xl md:text-6xl font-black text-blue-600 tracking-tighter uppercase">Lost in Space</span>
        </div>
      </div>

      <div class="space-y-6">
        <h2 class="text-3xl md:text-5xl font-black text-main tracking-tight">Oops! Page not found.</h2>
        <p class="text-lg text-muted font-medium max-w-lg mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved to a different dimension. Let's get you back on track.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          @click="$emit('navigate', 'home')"
          class="group px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-600/20 cursor-pointer"
        >
          <Home :size="18" />
          Back to Home
        </button>
        <button 
          @click="window.history.back()"
          class="px-8 py-4 bg-card-custom border border-main text-main rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <MoveLeft :size="18" />
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

h1 {
  animation: float 6s ease-in-out infinite;
}
</style>
