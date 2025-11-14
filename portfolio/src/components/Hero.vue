<script setup>
import { ref, onMounted } from 'vue'
import { Facebook, Instagram, Mail, ArrowRight, Figma, Flame, Code2, Zap, Wind } from 'lucide-vue-next'
import heroImage from '../assets/profile-removebg-preview.png'

const name = "CLA"
const title = "Student Developer & Tech Enthusiast"
const description = "4th Year BS Information Technology Student | Passionate about building innovative web solutions and learning modern technologies"

const displayedText = ref('')
const textIndex = ref(0)
const isTyping = ref(true)

const techStack = [
  { name: 'React', icon: Flame, color: 'text-blue-400' },
  { name: 'Vue.js', icon: Zap, color: 'text-green-500' },
  { name: 'TypeScript', icon: Code2, color: 'text-blue-600' },
  { name: 'Node.js', icon: Flame, color: 'text-green-600' },
  { name: 'Tailwind', icon: Wind, color: 'text-cyan-500' }
]

onMounted(() => {
  const typeText = () => {
    if (textIndex.value < title.length) {
      displayedText.value += title.charAt(textIndex.value)
      textIndex.value++
      setTimeout(typeText, 100)
    } else {
      isTyping.value = false
    }
  }
  
  typeText()
})
</script>

<template>
  <section class="min-h-screen px-4 bg-white pt-32 pb-20 relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="hero-bg-blob"></div>
    </div>
    <div class="container-main relative">
      <!-- Main Hero Content -->
      <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] gap-16 items-center mb-24">
        <!-- Left Content -->
        <div class="flex flex-col gap-10">
          <div class="space-y-6">
            <p class="text-blue-500 font-bold text-sm tracking-[0.4em] uppercase animate-fade-in">Hey there!</p>
            
            <div class="space-y-4">
              <h1 class="text-5xl lg:text-6xl xl:text-7xl font-black text-base-content leading-tight animate-fade-in-delay-1 tracking-tight">
                Charles Louie<br />Alvaran
              </h1>
            </div>
            
            <div class="h-16 flex items-center">
              <h2 class="text-2xl lg:text-3xl xl:text-4xl font-semibold text-blue-600 tracking-tight">
                <span>{{ displayedText }}</span>
                <span v-if="isTyping" class="animate-blink">|</span>
              </h2>
            </div>
          </div>
          
          <p class="text-base text-base-content/70 max-w-xl leading-relaxed font-medium animate-fade-in-delay-2">
            {{ description }}
          </p>

          <!-- Stat Badges -->
          <div class="grid grid-cols-3 gap-6 py-8">
            <div class="flex flex-col gap-2">
              <span class="text-3xl font-bold text-blue-600">4th</span>
              <span class="text-xs text-base-content/60 uppercase tracking-widest">Year Student</span>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-3xl font-bold text-blue-600">15+</span>
              <span class="text-xs text-base-content/60 uppercase tracking-widest">Projects Built</span>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-3xl font-bold text-blue-600">10+</span>
              <span class="text-xs text-base-content/60 uppercase tracking-widest">Tech Skills</span>
            </div>
          </div>
          
          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 pt-2">
            <button class="relative px-8 py-3 font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-0.5">
              <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative flex items-center gap-2">
                View My Work <ArrowRight :size="18" class="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
            <button class="relative px-8 py-3 font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 overflow-hidden group hover:-translate-y-0.5">
              <div class="relative">Get in Touch</div>
            </button>
          </div>

          <!-- Social Links -->
          <div class="flex gap-3 pt-6">
            <a
              href="https://www.facebook.com/CharlesLouieAlvaran/"
              target="_blank"
              rel="noopener"
              class="group relative p-3 rounded-full border border-base-300 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1"
            >
              <Facebook :size="24" class="text-base-content group-hover:text-blue-500 transition-colors" />
            </a>
            <a
              href="https://www.instagram.com/natsdyyy/"
              target="_blank"
              rel="noopener"
              class="group relative p-3 rounded-full border border-base-300 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1"
            >
              <Instagram :size="24" class="text-base-content group-hover:text-blue-500 transition-colors" />
            </a>
            <a
              href="mailto:charleslouiealvaran@gmail.com"
              class="group relative p-3 rounded-full border border-base-300 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1"
            >
              <Mail :size="24" class="text-base-content group-hover:text-blue-500 transition-colors" />
            </a>
          </div>
        </div>

        <!-- Right Image -->
        <div class="flex justify-center items-center">
          <div class="relative w-full max-w-xl flex justify-end">
            <div class="hero-spotlight">
              <img
                :src="heroImage"
                alt="Charles Louie Alvaran"
                class="hero-photo"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tech Stack Section -->
      <div class="space-y-8 animate-fade-in-delay-3">
        <div class="text-center mb-12">
          <h3 class="text-2xl font-bold text-base-content mb-2">Tech Stack & Tools</h3>
          <p class="text-base-content/60">Technologies I work with</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div v-for="tech in techStack" :key="tech.name" class="p-6 bg-white border-2 border-base-300 rounded-lg text-center hover:border-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105">
            <component :is="tech.icon" :size="32" :class="[tech.color, 'mx-auto mb-3 group-hover:scale-125 transition-transform duration-300']" />
            <p class="font-semibold text-sm">{{ tech.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-fade-in-delay-1 {
  animation: fadeIn 0.6s ease-out 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fadeIn 0.6s ease-out 0.4s both;
}

.animate-fade-in-delay-3 {
  animation: fadeIn 0.6s ease-out 0.6s both;
}

.animate-blink {
  animation: blink 0.8s infinite;
  font-weight: bold;
}

.hero-bg-blob {
  position: absolute;
  top: -30%;
  right: -10%;
  width: 65%;
  height: 120%;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 55%);
  z-index: 0;
  transform: rotate(-8deg);
}

.hero-spotlight {
  position: relative;
  width: clamp(18rem, 40vw, 28rem);
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #1e40af 100%);
  border-radius: 55% 45% 60% 40% / 60% 45% 55% 40%;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-shadow: 0 35px 60px -25px rgba(37, 99, 235, 0.45);
  overflow: hidden;
}

.hero-photo {
  width: 110%;
  max-width: none;
  object-fit: contain;
  transform: translateY(8%);
  transition: transform 0.6s ease, filter 0.6s ease;
}

.hero-spotlight:hover .hero-photo {
  transform: translateY(4%) scale(1.03);
  filter: drop-shadow(0 25px 35px rgba(15, 23, 42, 0.25));
}

@media (max-width: 1023px) {
  .hero-bg-blob {
    top: -10%;
    right: -30%;
    width: 90%;
    height: 80%;
  }

  .hero-spotlight {
    margin-inline: auto;
  }
}
</style>
