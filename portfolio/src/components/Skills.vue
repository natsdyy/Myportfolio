<script setup>
import { Code, Server, Wrench } from 'lucide-vue-next'

const skillCategories = [
  {
    icon: Code,
    category: "Frontend",
    skills: ["Vue.js", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"]
  },
  {
    icon: Server,
    category: "Backend",
    skills: ["Node.js", "Express", "PostgreSQL", "Firebase", "PHP (Native)"]
  },
  {
    icon: Wrench,
    category: "Tools & Platforms",
    skills: ["Git", "GitHub", "Railway", "Firebase Auth", "VS Code", "Postman"]
  }
]

const proficiency = [
  { skill: "Vue.js", level: 95 },
  { skill: "JavaScript", level: 90 },
  { skill: "CSS", level: 90 },
  { skill: "Node.js", level: 85 },
  { skill: "PostgreSQL", level: 82 },
  { skill: "Firebase / PHP Native", level: 78 }
]
</script>

<template>
  <section class="relative py-24 px-4 bg-white overflow-hidden">
    <div class="skills-bg-accent"></div>
    <div class="skills-bg-gradient"></div>

    <div class="container-main relative space-y-20">
      <!-- Header -->
      <div class="space-y-4 text-center max-w-3xl mx-auto">
        <p class="text-xs font-bold tracking-[0.3em] uppercase text-blue-500">Skillset</p>
        <h2 class="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
          A balanced toolkit across modern frontend, backend, and tooling.
        </h2>
        <p class="text-base lg:text-lg text-slate-600 leading-relaxed">
          I build performant interfaces, craft reliable APIs, and deploy experiences that scale. These are the technologies I lean on every day.
        </p>
      </div>

      <!-- Skill Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(category, idx) in skillCategories"
          :key="idx"
          class="skills-category group"
          :style="{ animationDelay: `${idx * 0.1}s` }"
        >
          <div class="skills-category-header">
            <div class="skills-category-icon">
              <component :is="category.icon" :size="22" />
            </div>
            <h3 class="skills-category-title">{{ category.category }}</h3>
          </div>
          <div class="skills-category-skills">
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

      <!-- Proficiency Panel -->
      <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
        <div class="skills-proficiency-panel">
          <div class="skills-proficiency-header">
            <h3 class="skills-proficiency-title">Proficiency Map</h3>
            <p class="skills-proficiency-subtitle">Core technologies I work with daily</p>
          </div>
          <div class="skills-proficiency-list">
            <div
              v-for="item in proficiency"
              :key="item.skill"
              class="skills-proficiency-item"
            >
              <div class="skills-proficiency-label">
                <span class="skills-proficiency-skill">{{ item.skill }}</span>
                <span class="skills-proficiency-percent">{{ item.level }}%</span>
              </div>
              <div class="skills-proficiency-bar-container">
                <div
                  class="skills-proficiency-bar"
                  :style="{ width: `${item.level}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Card -->
        <div class="skills-stats-card">
          <div class="skills-stats-content">
            <h3 class="skills-stats-title">Always learning, always iterating.</h3>
            <p class="skills-stats-description">
              From UI polish to infrastructure, I stay curious and adaptable so the solutions I ship feel modern today and ready for tomorrow.
            </p>
            <div class="skills-stats-grid">
              <div class="skills-stat-item">
                <span class="skills-stat-value">3+</span>
                <span class="skills-stat-label">Years building</span>
              </div>
              <div class="skills-stat-item">
                <span class="skills-stat-value">20+</span>
                <span class="skills-stat-label">Projects shipped</span>
              </div>
              <div class="skills-stat-item">
                <span class="skills-stat-value">∞</span>
                <span class="skills-stat-label">Curiosity</span>
              </div>
            </div>
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
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 60%);
  pointer-events: none;
}

.skills-bg-gradient {
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 50%;
  height: 60%;
  background: radial-gradient(circle at bottom right, rgba(191, 219, 254, 0.25), transparent 60%);
  filter: blur(40px);
  pointer-events: none;
}

/* Skill Categories */
.skills-category {
  padding: 2rem;
  border-radius: 1.5rem;
  border: 1.5px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.8));
  box-shadow: 
    0 4px 20px -8px rgba(15, 23, 42, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;
  position: relative;
  overflow: hidden;
}

.skills-category::before {
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

.skills-category:hover::before {
  opacity: 1;
}

.skills-category:hover {
  transform: translateY(-4px);
  border-color: rgba(37, 99, 235, 0.2);
  box-shadow: 
    0 12px 40px -12px rgba(37, 99, 235, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
}

.skills-category-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.skills-category-icon {
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

.skills-category:hover .skills-category-icon {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(59, 130, 246, 0.28));
  box-shadow: 0 6px 16px -4px rgba(37, 99, 235, 0.3);
}

.skills-category-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(15 23 42);
  transition: color 0.3s ease;
}

.skills-category:hover .skills-category-title {
  color: rgb(37 99 235);
}

.skills-category-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.skills-chip {
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

.skills-chip:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 16px -6px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.85), rgba(191, 219, 254, 0.65));
  border-color: rgba(147, 197, 253, 0.8);
}

/* Proficiency Panel */
.skills-proficiency-panel {
  padding: 2.5rem;
  border-radius: 1.5rem;
  border: 1.5px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.8));
  box-shadow: 
    0 4px 20px -8px rgba(15, 23, 42, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}

.skills-proficiency-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.skills-proficiency-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: rgb(15 23 42);
  margin-bottom: 0.5rem;
}

.skills-proficiency-subtitle {
  font-size: 0.875rem;
  color: rgb(100 116 139);
}

.skills-proficiency-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.skills-proficiency-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skills-proficiency-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skills-proficiency-skill {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(15 23 42);
}

.skills-proficiency-percent {
  font-size: 0.875rem;
  font-weight: 700;
  color: rgb(37 99 235);
}

.skills-proficiency-bar-container {
  position: relative;
  height: 0.5rem;
  border-radius: 9999px;
  background: rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.skills-proficiency-bar {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgb(59, 130, 246), rgb(37, 99, 235));
  box-shadow: 0 2px 8px -2px rgba(37, 99, 235, 0.4);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.skills-proficiency-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

/* Stats Card */
.skills-stats-card {
  padding: 2.5rem;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #1e40af 100%);
  color: white;
  box-shadow: 0 20px 60px -20px rgba(30, 64, 175, 0.5);
  position: relative;
  overflow: hidden;
}

.skills-stats-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%);
  pointer-events: none;
}

.skills-stats-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skills-stats-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}

.skills-stats-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.skills-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.skills-stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.skills-stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.skills-stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Responsive */
@media (max-width: 1023px) {
  .skills-stats-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .skills-stat-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
  }
}
</style>
