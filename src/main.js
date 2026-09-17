import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Initialize theme early to avoid flicker
const initTheme = () => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.style.colorScheme = 'dark'
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.style.colorScheme = 'light'
  }
}

initTheme()

createApp(App).mount('#app')
