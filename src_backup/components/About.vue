<script setup>
import { Code, BookOpen, Lightbulb, Heart } from 'lucide-vue-next'
import profileImage from '../assets/unnamed.jpg'

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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              v-for="(item, index) in highlights"
              :key="index"
              class="about-highlight group"
            >
              <div class="about-highlight-content">
                <div class="about-highlight-icon">
                  <component :is="item.icon" :size="22" />
                </div>
                <div class="space-y-1.5 flex-1">
                  <h3 class="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {{ item.title }}
                  </h3>
                  <p class="text-sm text-slate-600 leading-relaxed">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6 pt-2">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">Core Toolkit</span>
              <span class="h-px flex-1 bg-gradient-to-r from-slate-200 via-blue-200 to-slate-200"></span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                v-for="skillGroup in skills"
                :key="skillGroup.category"
                class="about-skill-card group"
              >
                <h4 class="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-3 group-hover:text-blue-600 transition-colors">
                  {{ skillGroup.category }}
                </h4>
                <div class="flex flex-wrap gap-2.5">
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
          <div class="about-portrait-container">
            <div class="about-portrait-frame">
              <div class="about-portrait-border">
                <img
                  :src="profileImage"
                  alt="Charles Louie Alvaran"
                  class="about-photo"
                />
              </div>
              <div class="about-portrait-glow"></div>
              <div class="about-portrait-decoration"></div>
            </div>
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
  padding: 1.75rem;
  border-radius: 1.5rem;
  border: 1.5px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.8));
  box-shadow: 
    0 4px 20px -8px rgba(15, 23, 42, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.about-highlight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.about-highlight:hover::before {
  opacity: 1;
}

.about-highlight:hover {
  transform: translateY(-4px);
  border-color: rgba(37, 99, 235, 0.2);
  box-shadow: 
    0 12px 40px -12px rgba(37, 99, 235, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
}

.about-highlight-content {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.about-highlight-icon {
  display: flex;
  width: 3rem;
  height: 3rem;
  min-width: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(59, 130, 246, 0.2));
  color: rgb(37 99 235);
  transition: all 0.4s ease;
  box-shadow: 0 4px 12px -4px rgba(37, 99, 235, 0.2);
}

.about-highlight:hover .about-highlight-icon {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(59, 130, 246, 0.28));
  box-shadow: 0 6px 16px -4px rgba(37, 99, 235, 0.3);
}

.about-skill-card {
  border: 1.5px solid rgba(15, 23, 42, 0.06);
  border-radius: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.7));
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px -6px rgba(15, 23, 42, 0.1);
}

.about-skill-card:hover {
  border-color: rgba(37, 99, 235, 0.15);
  box-shadow: 0 8px 24px -8px rgba(37, 99, 235, 0.2);
  transform: translateY(-2px);
}

.about-skill-chip {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(37 99 235);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.7), rgba(191, 219, 254, 0.5));
  border: 1px solid rgba(147, 197, 253, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  display: inline-block;
}

.about-skill-chip:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 16px -6px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.85), rgba(191, 219, 254, 0.65));
  border-color: rgba(147, 197, 253, 0.8);
}

.about-portrait-container {
  position: relative;
  width: 100%;
  max-width: 28rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.about-portrait-frame {
  position: relative;
  width: clamp(20rem, 35vw, 28rem);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-portrait-border {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  padding: 0.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 30%, #e2e8f0 100%);
  box-shadow: 
    0 25px 70px -20px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset,
    0 0 0 2px rgba(59, 130, 246, 0.08);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  overflow: hidden;
}

.about-portrait-frame:hover .about-portrait-border {
  transform: scale(1.02);
  box-shadow: 
    0 35px 90px -25px rgba(37, 99, 235, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset,
    0 0 0 3px rgba(59, 130, 246, 0.12);
}

.about-photo {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  object-position: center top;
  display: block;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s ease;
  filter: brightness(1.02) contrast(1.05);
}

.about-portrait-frame:hover .about-photo {
  transform: scale(1.01);
  filter: brightness(1.05) contrast(1.08);
}

.about-portrait-glow {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 1;
  pointer-events: none;
}

.about-portrait-frame:hover .about-portrait-glow {
  opacity: 1;
}

.about-portrait-decoration {
  position: absolute;
  top: -10%;
  right: -5%;
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%);
  z-index: 0;
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-20px) translateX(10px);
  }
}

@media (max-width: 1023px) {
  .about-bg-ring {
    top: -10%;
    left: -45%;
    width: 55rem;
    height: 55rem;
  }

  .about-portrait-container {
    margin-top: 3rem;
    margin-inline: auto;
  }

  .about-portrait-frame {
    max-width: 24rem;
  }
}
</style>
