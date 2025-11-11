<script setup>
import { Code, Server, Wrench } from 'lucide-vue-next'

const skillCategories = [
  {
    icon: Code,
    category: "Frontend",
    skills: ["Vue.js", "React", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS"]
  },
  {
    icon: Server,
    category: "Backend",
    skills: ["Node.js", "Express", "Python", "Django", "PostgreSQL", "MongoDB"]
  },
  {
    icon: Wrench,
    category: "Tools & Platforms",
    skills: ["Git", "GitHub", "Docker", "AWS", "Vercel", "Netlify", "VS Code"]
  }
]

const proficiency = [
  { skill: "Vue.js", level: 95 },
  { skill: "JavaScript", level: 90 },
  { skill: "React", level: 85 },
  { skill: "CSS", level: 90 },
  { skill: "Node.js", level: 85 },
  { skill: "TypeScript", level: 80 }
]
</script>

<template>
  <section class="relative py-24 px-4 bg-white overflow-hidden">
    <div class="skills-bg-accent"></div>
    <div class="skills-bg-gradient"></div>

    <div class="container-main relative space-y-16">
      <div class="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-20 items-start">
        <div class="space-y-8">
          <div class="space-y-4">
            <p class="text-sm font-semibold tracking-[0.35em] uppercase text-blue-500">Skillset</p>
            <h2 class="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              A balanced toolkit across modern frontend, backend, and tooling.
            </h2>
            <p class="text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl">
              I build performant interfaces, craft reliable APIs, and deploy experiences that scale. These are the technologies I lean on every day.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="(category, idx) in skillCategories"
              :key="idx"
              class="skills-category"
              :style="{ animationDelay: `${idx * 0.12}s` }"
            >
              <div class="skills-category-icon">
                <component :is="category.icon" :size="24" />
              </div>
              <div class="min-w-0 space-y-3">
                <h3 class="text-lg font-semibold text-slate-900">{{ category.category }}</h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <span
                    v-for="skill in category.skills"
                    :key="skill"
                    class="skills-chip"
                  >
                    {{ skill }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="skills-panel">
          <h3 class="mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-100/70">Proficiency Map</h3>
          <div class="space-y-7">
            <div
              v-for="item in proficiency"
              :key="item.skill"
              class="space-y-2"
            >
              <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-blue-100/60">
                <span>{{ item.skill }}</span>
                <span class="text-blue-100">{{ item.level }}%</span>
              </div>
              <div class="relative h-3 overflow-hidden rounded-full bg-white/20">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_18px_rgba(56,189,248,0.6)]"
                  :style="{ width: `${item.level}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="skills-cta">
        <div>
          <h3 class="text-2xl lg:text-3xl font-semibold text-white">Always learning, always iterating.</h3>
          <p class="text-white/70 text-base lg:text-lg">
            From UI polish to infrastructure, I stay curious and adaptable so the solutions I ship feel modern today and ready for tomorrow.
          </p>
        </div>
        <div class="flex flex-wrap gap-4 items-center">
          <div class="skills-stat">
            <span class="skills-stat-value">7+</span>
            <span class="skills-stat-label">Years coding</span>
          </div>
          <div class="skills-stat">
            <span class="skills-stat-value">20+</span>
            <span class="skills-stat-label">Projects shipped</span>
          </div>
          <div class="skills-stat">
            <span class="skills-stat-value">∞</span>
            <span class="skills-stat-label">Curiosity</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skills-bg-accent {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 60%);
  pointer-events: none;
}

.skills-bg-gradient {
  position: absolute;
  bottom: -35%;
  right: -15%;
  width: 55%;
  height: 70%;
  background: radial-gradient(circle at bottom right, rgba(191, 219, 254, 0.4), transparent 55%);
  filter: blur(0px);
  pointer-events: none;
}

.skills-category {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2.25rem;
  border-radius: 2.25rem;
  border: 1px solid rgba(37, 99, 235, 0.14);
  background: linear-gradient(160deg, rgba(248, 250, 255, 0.98), rgba(219, 234, 254, 0.85));
  box-shadow: 0 35px 70px -38px rgba(37, 99, 235, 0.45);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
  opacity: 0;
  transform: translateY(20px);
  animation: floatUp 0.85s ease forwards;
}

.skills-category:hover {
  transform: translateY(-10px);
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 42px 85px -32px rgba(59, 130, 246, 0.55);
}

.skills-category-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1.5rem;
  color: rgb(37 99 235);
  background: radial-gradient(circle at 30% 30%, rgba(37, 99, 235, 0.18), rgba(96, 165, 250, 0.22));
  box-shadow: inset 0 1px 8px rgba(255, 255, 255, 0.6);
}

.skills-category h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: rgb(15 23 42);
}

.skills-chip {
  width: 100%;
  padding: 0.8rem 1.2rem;
  border-radius: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: rgb(30 64 175);
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.95), rgba(191, 219, 254, 0.6));
  transition: transform 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
}

.skills-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px -18px rgba(59, 130, 246, 0.5);
  color: rgb(29 78 216);
}

@keyframes floatUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.skills-panel {
  border-radius: 2rem;
  padding: clamp(2rem, 4vw, 3rem);
  background: radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.18), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.25), transparent 50%),
    linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 45px 70px -35px rgba(15, 23, 42, 0.7);
}

.skills-cta {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  border-radius: 2rem;
  padding: clamp(2rem, 4vw, 3rem);
  background: linear-gradient(120deg, #1d4ed8, #2563eb 40%, #1e40af 100%);
  color: white;
  box-shadow: 0 40px 65px -38px rgba(30, 64, 175, 0.6);
  position: relative;
  overflow: hidden;
}

.skills-cta::after {
  content: "";
  position: absolute;
  inset: 10% 5%;
  border-radius: inherit;
  background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.25), transparent 60%);
  opacity: 0.9;
  pointer-events: none;
}

.skills-cta > * {
  position: relative;
  z-index: 1;
}

.skills-stat {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.skills-stat-value {
  font-size: clamp(2rem, 2.8vw, 2.5rem);
  font-weight: 700;
}

.skills-stat-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.65);
}

@media (max-width: 1023px) {
  .skills-panel {
    order: -1;
  }
}
</style>
