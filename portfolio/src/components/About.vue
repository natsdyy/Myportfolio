<script setup>
import { Code, BookOpen, Lightbulb, Heart } from 'lucide-vue-next'
import profileImage from '../assets/profile-removebg-preview.png'

const aboutText = "I'm a 4th Year BS Information Technology student with a passion for web development and technology. I love solving real-world problems through code and continuously learning new technologies. My journey has been about building practical projects while developing a strong foundation in IT fundamentals."

const highlights = [
  { 
    icon: Code, 
    title: "Web Development", 
    description: "Building responsive and interactive web applications with Vue.js, React, and modern JavaScript"
  },
  { 
    icon: BookOpen, 
    title: "Continuous Learner", 
    description: "Always exploring new technologies and best practices in software development"
  },
  { 
    icon: Lightbulb, 
    title: "Problem Solver", 
    description: "Passionate about tackling challenging problems and finding efficient solutions"
  },
  { 
    icon: Heart, 
    title: "Dedicated", 
    description: "Committed to delivering quality code and creating meaningful projects"
  }
]

const skills = [
  { category: "Frontend", items: ["Vue.js", "React", "Tailwind CSS", "TypeScript"] },
  { category: "Backend", items: ["Node.js", "Express.js", "MongoDB", "REST APIs"] },
  { category: "Tools", items: ["Git", "Vite", "VS Code", "Figma"] },
  { category: "Concepts", items: ["OOP", "Data Structures", "Algorithms", "Web Design"] }
]
</script>

<template>
  <section class="relative py-24 px-4 bg-white overflow-hidden">
    <div class="about-bg-accent"></div>
    <div class="about-bg-ring"></div>

    <div class="container-main relative">
      <div class="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
        <!-- Text Content -->
        <div class="space-y-10">
          <div class="space-y-4">
            <p class="text-sm font-semibold tracking-[0.35em] uppercase text-blue-500">About</p>
            <h2 class="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Building thoughtful experiences with clean, modern code.
            </h2>
            <p class="text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {{ aboutText }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="(item, index) in highlights"
              :key="index"
              class="about-highlight group"
            >
              <div class="about-highlight-icon">
                <component :is="item.icon" :size="24" />
              </div>
              <div class="space-y-1">
                <h3 class="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {{ item.title }}
                </h3>
                <p class="text-sm text-slate-600">{{ item.description }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-blue-500 uppercase tracking-[0.25em]">Core Toolkit</span>
              <span class="h-px flex-1 bg-slate-200"></span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="skillGroup in skills"
                :key="skillGroup.category"
                class="about-skill-card"
              >
                <h4 class="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  {{ skillGroup.category }}
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="skill in skillGroup.items"
                    :key="skill"
                    class="about-skill-chip"
                  >
                    {{ skill }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Image -->
        <div class="relative flex justify-center lg:justify-end">
          <div class="about-spotlight">
            <img
              :src="profileImage"
              alt="Charles Louie Alvaran"
              class="about-photo"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-bg-accent {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 55%);
  pointer-events: none;
}

.about-bg-ring {
  position: absolute;
  top: 5%;
  left: -15%;
  width: 45rem;
  height: 45rem;
  background: conic-gradient(from 90deg at 50% 50%, rgba(59, 130, 246, 0.15), transparent 60%);
  filter: blur(40px);
  opacity: 0.6;
  pointer-events: none;
}

.about-highlight {
  display: flex;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.85), rgba(248, 250, 252, 0.65));
  box-shadow: 0 20px 40px -32px rgba(15, 23, 42, 0.45);
  transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
}

.about-highlight:hover {
  transform: translateY(-6px);
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 24px 55px -25px rgba(37, 99, 235, 0.45);
}

.about-highlight-icon {
  display: flex;
  width: 3.25rem;
  height: 3.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(59, 130, 246, 0.25));
  color: rgb(37 99 235);
}

.about-skill-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1.25rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.about-skill-chip {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgb(37 99 235);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.6), rgba(191, 219, 254, 0.45));
  border: 1px solid rgba(147, 197, 253, 0.6);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.about-skill-chip:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -12px rgba(59, 130, 246, 0.45);
}

.about-spotlight {
  position: relative;
  width: clamp(18rem, 38vw, 26rem);
  aspect-ratio: 3 / 4;
  border-radius: 60% 40% 55% 45% / 55% 45% 60% 45%;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 45%, #1d4ed8 100%);
  padding: clamp(1.25rem, 3vw, 2.25rem);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-shadow: 0 42px 65px -32px rgba(30, 64, 175, 0.55);
  overflow: hidden;
}

.about-spotlight::before {
  content: "";
  position: absolute;
  inset: 10%;
  border-radius: inherit;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.28), transparent 65%);
  opacity: 0.9;
}

.about-photo {
  position: relative;
  width: 110%;
  object-fit: contain;
  transform: translateY(6%);
  transition: transform 0.6s ease, filter 0.6s ease;
  filter: drop-shadow(0 12px 24px rgba(15, 23, 42, 0.25));
}

.about-spotlight:hover .about-photo {
  transform: translateY(3%) scale(1.02);
  filter: drop-shadow(0 28px 32px rgba(15, 23, 42, 0.3));
}

@media (max-width: 1023px) {
  .about-bg-ring {
    top: -10%;
    left: -45%;
    width: 55rem;
    height: 55rem;
  }

  .about-spotlight {
    margin-top: 3rem;
  }
}
</style>
