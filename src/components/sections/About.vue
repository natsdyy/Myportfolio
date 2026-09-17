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
  <section id="about" class="relative py-16 sm:py-20 lg:py-24 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Abstract background elements (Removed for minimalism) -->

    <div class="container-main relative w-full">
      <div class="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] xl:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-14 xl:gap-20 items-start w-full">
        
        <!-- Visual Side (Left) -->
        <div class="relative hidden md:flex justify-start w-full">
          <div class="relative w-full max-w-sm lg:max-w-md">
            <div class="relative z-10 rounded-2xl overflow-hidden bg-card-custom p-2 shadow-lg border border-main transition-transform duration-500 hover:-translate-y-1">
              <img
                :src="profileImage"
                alt="Charles Louie Alvaran"
                class="w-full h-auto object-cover rounded-xl transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        <!-- Content Side (Right) -->
        <div class="space-y-8 sm:space-y-10 lg:space-y-12 pt-0 md:pt-4">
          <div class="space-y-6">
            <div class="inline-flex items-center gap-3">
              <span class="h-px w-8 bg-blue-600"></span>
              <span class="text-xs font-semibold uppercase tracking-wide text-blue-600">About Me</span>
            </div>

            <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-main leading-[1.1] tracking-tight">
              Turning Ideas into <br />
              <span class="text-blue-600">Simple</span> Digital Solutions.
            </h2>

            <p class="text-sm sm:text-base lg:text-lg text-muted leading-relaxed font-medium max-w-xl">
              {{ aboutText }}
            </p>
          </div>

          <!-- Feature Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div
              v-for="(item, index) in highlights"
              :key="index"
              class="group p-5 sm:p-6 lg:p-8 rounded-2xl bg-card-custom border border-main transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div class="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <component :is="item.icon" :size="20" />
              </div>
              <h3 class="text-lg font-semibold text-main mb-3 transition-colors">{{ item.title }}</h3>
              <p class="text-sm text-muted leading-relaxed">{{ item.description }}</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
