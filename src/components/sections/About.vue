<script setup>
import { Code, BookOpen, Lightbulb, Heart, Sparkles } from 'lucide-vue-next'
import profileImage from '../../assets/profile.png'

const aboutText = "Recent Information Technology graduate with a strong interest in technology and software development. I am eager to begin my career by learning about your company’s work, culture, and approach to solving problems. My goal is to contribute meaningfully while gaining experience and growing alongside your team in a collaborative environment."

const highlights = [
  { 
    icon: Code, 
    title: "Engineering", 
    description: "Building scalable web applications with Vue.js, React, and modern JavaScript architectures."
  },
  { 
    icon: Lightbulb, 
    title: "Innovation", 
    description: "Tackling complex problems with creative, efficient, and user-centric solutions."
  }
]
</script>

<template>
  <section class="relative py-32 px-4 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Abstract background elements -->
    <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[40rem] h-[40rem] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[30rem] h-[30rem] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none"></div>

    <div class="container-main relative">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <!-- Content Side -->
        <div class="space-y-12">
          <div class="space-y-6">
            <div class="inline-flex items-center gap-3">
              <span class="h-px w-8 bg-blue-600"></span>
              <span class="text-xs font-black uppercase tracking-[0.4em] text-blue-600">The Narrative</span>
            </div>
            <h2 class="text-5xl lg:text-6xl font-black text-main leading-[1.1] tracking-tighter">
              Blending Technical <br /><span class="text-blue-600">Logic</span> with Human <br />Experience.
            </h2>
            <p class="text-xl text-muted leading-relaxed font-medium max-w-xl">
              {{ aboutText }}
            </p>
          </div>

          <!-- Feature Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="(item, index) in highlights"
              :key="index"
              class="group p-8 rounded-[2rem] bg-card-custom border border-main transition-all hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-xl"
            >
              <div class="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50/50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <component :is="item.icon" :size="24" />
              </div>
              <h3 class="text-lg font-bold text-main mb-2 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
              <p class="text-sm text-muted leading-relaxed">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Side -->
        <div class="relative">
          <div class="relative z-10 rounded-[3rem] overflow-hidden border-[12px] border-card-custom shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
            <img
              :src="profileImage"
              alt="Charles Louie Alvaran"
              class="w-full h-auto object-cover grayscale-[0.2] contrast-[1.05]"
            />
          </div>
          <!-- Decorative bits -->
          <div class="absolute -top-6 -right-6 h-32 w-32 bg-blue-600/10 rounded-3xl -z-0 rotate-12 blur-sm"></div>
          <div class="absolute -bottom-10 -left-10 h-64 w-64 border border-main rounded-full -z-0"></div>
          
          <div class="absolute bottom-10 right-10 z-20 p-6 bg-card-custom/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-main flex items-center gap-4 animate-bounce-slow">
            <div class="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Sparkles :size="24" />
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-muted">Status</p>
              <p class="text-sm font-bold text-main">Open for Work</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce-slow 4s infinite ease-in-out;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
</style>
