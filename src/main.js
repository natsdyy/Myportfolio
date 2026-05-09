import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Initialize theme early to avoid flicker
const initTheme = () => {
  // Default to light mode
  document.documentElement.classList.remove('dark')
  document.documentElement.setAttribute('data-theme', 'light')
}

initTheme()

createApp(App).mount('#app')
