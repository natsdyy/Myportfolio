import { ref, onMounted, watch } from 'vue'

const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
const isDark = ref(savedTheme === 'dark')

export function useTheme() {
  const applyTheme = () => {
    const html = document.documentElement
    
    if (isDark.value) {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
      html.style.colorScheme = 'dark'
      try { localStorage.setItem('theme', 'dark') } catch (e) {}
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
      html.style.colorScheme = 'light'
      try { localStorage.setItem('theme', 'light') } catch (e) {}
    }
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme()
  }

  onMounted(() => {
    applyTheme()
  })

  watch(isDark, () => {
    applyTheme()
  })

  return {
    isDark,
    toggleTheme
  }
}
