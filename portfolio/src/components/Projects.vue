<script setup>
import { Github, ExternalLink } from 'lucide-vue-next'

const projects = [
  {
    id: 1,
    title: "Countryside Steakhouse",
    description:
      "Restaurant website for a 41+ year old steakhouse chain with multiple branches across Cavite. Features menu browsing, branch locator, and online reservations.",
    tags: ["Vue.js", "Node.js", "PostgreSQL"],
    image: "https://www.countryside-steakhouse.site/logo1.png",
    link: "https://www.countryside-steakhouse.site",
    github: "#"
  },
  {
    id: 2,
    title: "Rentopia",
    description:
      "Smart dormitory and rental marketplace connecting students with trusted dorm owners. Features verified listings, smart filters, and secure booking system.",
    tags: ["PHP Native", "React", "Firebase"],
    image: "https://www.rentopia.online/assets/img/aboutus.png",
    link: "https://www.rentopia.online",
    github: "#"
  }
]
</script>

<template>
  <section class="relative py-24 px-4 bg-white overflow-hidden">
    <div class="projects-bg-accent"></div>
    <div class="projects-bg-glow"></div>

    <div class="container-main relative space-y-16">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div class="space-y-4 max-w-3xl">
          <p class="text-sm font-semibold tracking-[0.35em] uppercase text-blue-500">Selected Work</p>
          <h2 class="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            A snapshot of the products and experiences I’ve crafted.
          </h2>
          <p class="text-base lg:text-lg text-slate-600 leading-relaxed">
            These projects combine thoughtful UX, modern frontends, and reliable infrastructure—each tailored to the teams and audiences they serve.
          </p>
        </div>
        <div class="projects-highlight">
          <span class="projects-highlight-label">Focus Areas</span>
          <div class="flex flex-wrap gap-2">
            <span class="projects-highlight-chip">Product Design</span>
            <span class="projects-highlight-chip">Team Collaboration</span>
            <span class="projects-highlight-chip">UX Systems</span>
            <span class="projects-highlight-chip">Scaling Apps</span>
          </div>
        </div>
      </div>

      <div class="projects-grid">
        <article
          v-for="project in projects"
          :key="project.id"
          class="project-card"
        >
          <div class="project-media">
            <div class="project-media-overlay"></div>
            <img
              v-if="project.image && project.image !== '#'"
              :src="project.image"
              :alt="project.title"
              class="project-image"
            />
            <div v-else class="project-placeholder">📁</div>
            <div class="project-links">
              <a
                v-if="project.link"
                :href="project.link"
                target="_blank"
                rel="noopener noreferrer"
                class="project-link-btn"
              >
                <ExternalLink :size="18" />
                View live
              </a>
              <a
                v-if="project.github && project.github !== '#'"
                :href="project.github"
                target="_blank"
                rel="noopener noreferrer"
                class="project-link-btn"
              >
                <Github :size="18" />
                Source
              </a>
            </div>
          </div>

          <div class="project-content">
            <div class="flex items-start justify-between gap-4">
              <h3 class="project-title">{{ project.title }}</h3>
              <span class="project-index">0{{ project.id }}</span>
            </div>
            <p class="project-description">{{ project.description }}</p>

            <div class="project-tags">
              <span
                v-for="tag in project.tags"
                :key="tag"
                class="project-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.projects-bg-accent {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 60%);
  pointer-events: none;
}

.projects-bg-glow {
  position: absolute;
  top: 45%;
  left: -20%;
  width: 65%;
  height: 65%;
  background: radial-gradient(circle at left, rgba(147, 197, 253, 0.35), transparent 65%);
  pointer-events: none;
  filter: blur(0px);
  opacity: 0.8;
}

.projects-highlight {
  border-radius: 1.75rem;
  padding: 1.75rem;
  background: linear-gradient(130deg, rgba(23, 37, 84, 0.92), rgba(37, 99, 235, 0.92));
  color: white;
  box-shadow: 0 45px 65px -42px rgba(37, 99, 235, 0.55);
  display: grid;
  gap: 1.25rem;
  max-width: 20rem;
}

.projects-highlight-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.68);
}

.projects-highlight-chip {
  padding: 0.45rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  transition: transform 0.3s ease, background 0.3s ease;
}

.projects-highlight-chip:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.25);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.25rem;
}

.project-card {
  display: grid;
  gap: 1.75rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(241, 245, 249, 0.72));
  box-shadow: 0 32px 60px -36px rgba(15, 23, 42, 0.45);
  overflow: hidden;
  transition: transform 0.45s ease, box-shadow 0.45s ease, border-color 0.45s ease;
}

.project-card:hover {
  transform: translateY(-12px);
  border-color: rgba(37, 99, 235, 0.32);
  box-shadow: 0 38px 70px -35px rgba(37, 99, 235, 0.55);
}

.project-media {
  position: relative;
  height: clamp(220px, 30vw, 260px);
  overflow: hidden;
}

.project-image,
.project-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
  transition: transform 0.6s ease;
}

.project-placeholder {
  display: grid;
  place-items: center;
  font-size: 3rem;
  color: rgba(37, 99, 235, 0.3);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(96, 165, 250, 0.18));
}

.project-card:hover .project-image,
.project-card:hover .project-placeholder {
  transform: scale(1.07);
}

.project-media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.55));
  opacity: 0;
  transition: opacity 0.45s ease;
  pointer-events: none;
}

.project-card:hover .project-media-overlay {
  opacity: 1;
}

.project-links {
  position: absolute;
  inset: auto 1.5rem 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.project-card:hover .project-links {
  opacity: 1;
  transform: translateY(0);
}

.project-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  color: rgb(15 23 42);
  font-weight: 600;
  font-size: 0.85rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.project-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -16px rgba(255, 255, 255, 0.5);
}

.project-content {
  display: grid;
  gap: 1rem;
  padding: 0 2rem 2rem 2rem;
}

.project-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: rgb(15 23 42);
  line-height: 1.3;
}

.project-index {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.35);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.project-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(15, 23, 42, 0.7);
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.project-tag {
  padding: 0.4rem 0.95rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(37 99 235);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.75), rgba(191, 219, 254, 0.45));
  border: 1px solid rgba(147, 197, 253, 0.6);
}

@media (max-width: 1023px) {
  .projects-highlight {
    max-width: 100%;
  }

  .project-content {
    padding: 0 1.75rem 1.75rem 1.75rem;
  }
}
</style>
