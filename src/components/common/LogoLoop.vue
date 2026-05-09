<script setup>
import { computed } from 'vue';

const props = defineProps({
  logos: {
    type: Array,
    required: true,
  },
  speed: {
    type: Number,
    default: 100,
  },
  direction: {
    type: String,
    default: 'left',
  },
  logoHeight: {
    type: Number,
    default: 50,
  },
  gap: {
    type: Number,
    default: 40,
  },
  hoverSpeed: {
    type: Number,
    default: 0,
  },
  scaleOnHover: {
    type: Boolean,
    default: false,
  },
  fadeOut: {
    type: Boolean,
    default: false,
  },
  fadeOutColor: {
    type: String,
    default: '#ffffff',
  },
});

const doubledLogos = computed(() => [...props.logos, ...props.logos]);

const animationDuration = computed(() => {
  const baseDuration = 40;
  return `${baseDuration * (100 / props.speed)}s`;
});

const fadeOutStyle = computed(() => {
  if (!props.fadeOut) return {};
  return {
    background: `linear-gradient(to right, ${props.fadeOutColor} 0%, rgba(255,255,255,0) 15%, rgba(255,255,255,0) 85%, ${props.fadeOutColor} 100%)`,
  };
});
</script>

<template>
  <div class="logo-loop-container">
    <div
      class="logo-loop-track"
      :style="{
        '--duration': animationDuration,
        '--gap': `${gap}px`,
        animationDirection: direction === 'right' ? 'reverse' : 'normal',
      }"
    >
      <div v-for="(logo, index) in doubledLogos" :key="index" class="logo-item">
        <a
          v-if="logo.href"
          :href="logo.href"
          target="_blank"
          rel="noopener noreferrer"
          class="logo-link"
          :style="{ height: `${logoHeight}px` }"
        >
          <div v-if="logo.node" class="logo-node text-slate-900 dark:text-white">
            <component :is="logo.node" :size="logoHeight * 0.8" />
            <span v-if="logo.title" class="logo-title text-slate-500 dark:text-slate-400">{{ logo.title }}</span>
          </div>
          <img
            v-else-if="logo.src"
            :src="logo.src"
            :alt="logo.alt || 'Logo'"
            class="logo-img"
          />
        </a>
        <div
          v-else
          class="logo-link"
          :style="{ height: `${logoHeight}px` }"
        >
          <div v-if="logo.node" class="logo-node text-slate-900 dark:text-white">
            <component :is="logo.node" :size="logoHeight * 0.8" />
            <span v-if="logo.title" class="logo-title text-slate-500 dark:text-slate-400">{{ logo.title }}</span>
          </div>
          <img
            v-else-if="logo.src"
            :src="logo.src"
            :alt="logo.alt || 'Logo'"
            class="logo-img"
          />
        </div>
      </div>
    </div>
    <div v-if="fadeOut" class="fade-overlay" :style="fadeOutStyle"></div>
  </div>
</template>

<style scoped>
.logo-loop-container {
  width: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
}

.logo-loop-track {
  display: flex;
  width: max-content;
  gap: var(--gap);
  animation: scroll var(--duration) linear infinite;
  padding: 10px 0;
}

.logo-loop-track:hover {
  animation-play-state: paused;
}

.logo-item {
  flex-shrink: 0;
}

.logo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.logo-link:hover {
  transform: scale(1.1);
}

.logo-img {
  height: 100%;
  width: auto;
  object-fit: contain;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.logo-link:hover .logo-img {
  opacity: 1;
}

.logo-node {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.logo-link:hover .logo-node {
  opacity: 1;
}

.logo-title {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.4;
}

.logo-link:hover .logo-title {
  opacity: 1;
}

.fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - (var(--gap) / 2))); }
}
</style>
