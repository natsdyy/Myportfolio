<script setup>
import { Code, BookOpen, Lightbulb, Heart, Sparkles } from 'lucide-vue-next'
import profileImage from '../../assets/profile.png'

  const aboutText = "I’m an Information Technology graduate passionate about building useful digital solutions. I enjoy turning ideas into practical websites and applications, using modern technology and AI to work smarter and solve real-world problems. I’m always eager to learn, improve my skills, and create solutions that make a meaningful difference."

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
  <section id="about" class="relative py-32 px-4 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Abstract background elements -->
    <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[40rem] h-[40rem] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[30rem] h-[30rem] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none"></div>

    <div class="container-main relative mx-auto max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20 items-start">
        
        <!-- Visual Side (Left) -->
        <div class="relative hidden lg:flex justify-start w-full">
          <div class="relative w-full max-w-[32rem]">
            <div class="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 opacity-50 blur-2xl transition-opacity duration-700"></div>
            <div class="relative z-10 rounded-[2.5rem] overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-card-custom p-2 shadow-2xl transition-transform duration-700 hover:rotate-1">
              <img
                :src="profileImage"
                alt="Charles Louie Alvaran"
                class="w-full h-auto object-cover rounded-[2rem] grayscale-[0.1] contrast-[1.02]"
              />
            </div>
          </div>
        </div>

        <!-- Content Side (Right) -->
        <div class="space-y-12 pt-4">
          <div class="space-y-6">
            <div class="inline-flex items-center gap-3">
              <span class="h-px w-8 bg-blue-600"></span>
              <span class="text-xs font-black uppercase tracking-[0.4em] text-blue-600">About Me</span>
            </div>

            <h2 class="text-5xl lg:text-7xl font-black text-main leading-[1] tracking-tighter">
              Turning Ideas into <br />
              <span class="text-blue-600">Simple</span> Digital Solutions.
            </h2>

            <p class="text-lg text-muted leading-relaxed font-medium max-w-xl">
              {{ aboutText }}
            </p>
          </div>

          <!-- Feature Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              v-for="(item, index) in highlights"
              :key="index"
              class="group p-8 rounded-[2rem] bg-card-custom border border-main transition-all hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-xl"
            >
              <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 border border-blue-600/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                <component :is="item.icon" :size="24" />
              </div>
              <h3 class="text-lg font-bold text-main mb-3 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
              <p class="text-sm text-muted leading-relaxed">{{ item.description }}</p>
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
