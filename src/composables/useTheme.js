import { ref, onMounted, watch } from 'vue'

const isDark = ref(false)

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
    console.log('--- Theme Toggle Action ---')
    console.log('New state isDark:', isDark.value)
    applyTheme()
  }

  const applyTheme = () => {
    const html = document.documentElement
    
    if (isDark.value) {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
      html.style.colorScheme = 'dark'
      console.log('DOM: Applied DARK mode')
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
      html.style.colorScheme = 'light'
      console.log('DOM: Applied LIGHT mode')
    }
    
    // Safety check: sometimes attributes are more reliable than classes for CSS selectors
    console.log('Current HTML classList:', Array.from(html.classList))
  }

  onMounted(() => {
    applyTheme()
    
    // Aggressive re-application to fight against system overrides or other scripts
    setTimeout(applyTheme, 100)
    setTimeout(applyTheme, 500)
  })

  watch(isDark, () => {
    applyTheme()
  })

  return {
    isDark,
    toggleTheme
  }
}
