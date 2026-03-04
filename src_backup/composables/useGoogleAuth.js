import { ref, computed } from 'vue'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const STORAGE_KEY = 'google_auth_state'

const user = ref(null)
const idToken = ref(null)
const ready = ref(false)
const authError = ref(null)

let initialized = false
let waitingForGoogle = false

// Load saved auth state from localStorage
const loadSavedAuth = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.idToken && parsed.user) {
        idToken.value = parsed.idToken
        user.value = parsed.user
      }
    }
  } catch (error) {
    console.error('[google-auth] Failed to load saved auth', error)
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Save auth state to localStorage
const saveAuth = () => {
  try {
    if (idToken.value && user.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        idToken: idToken.value,
        user: user.value
      }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (error) {
    console.error('[google-auth] Failed to save auth', error)
  }
}

// Load on module init
if (typeof window !== 'undefined') {
  loadSavedAuth()
}

const decodeJwt = (token) => {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch (error) {
    console.error('[google-auth] Failed to decode token', error)
    return null
  }
}

const waitForGoogle = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'))
      return
    }

    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    if (waitingForGoogle) {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Google script failed to load'))
      }, 7000)
      return
    }

    waitingForGoogle = true

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!script) {
      reject(new Error('Google Identity script tag missing in index.html'))
      return
    }

    script.addEventListener('load', () => {
      waitingForGoogle = false
      resolve()
    })
    script.addEventListener('error', () => {
      waitingForGoogle = false
      reject(new Error('Failed to load Google Identity script'))
    })
  })

const handleCredential = (response) => {
  idToken.value = response.credential
  const profile = decodeJwt(response.credential)
  if (profile) {
    user.value = {
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
    }
    saveAuth()
  }
}

const initializeClient = async () => {
  if (initialized || !clientId) return

  await waitForGoogle()

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup', // Keep popup for better UX
      itp_support: true, // Support Intelligent Tracking Prevention
    })

    initialized = true
    ready.value = true
  } catch (error) {
    console.error('[google-auth] Failed to initialize', error)
    authError.value = 'Failed to initialize Google Sign-In. Please check your browser settings.'
  }
}

const renderGoogleButton = async (element, options = {}) => {
  if (!element) return
  if (!clientId) {
    authError.value = 'Missing VITE_GOOGLE_CLIENT_ID'
    return
  }

  try {
    await initializeClient()

    window.google.accounts.id.renderButton(
      element,
      Object.assign(
        {
          type: 'standard',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          shape: 'pill',
          logo_alignment: 'left',
        },
        options
      )
    )

    // Try to prompt, but ignore errors (FedCM/COOP related errors are harmless)
    if (window.google?.accounts?.id?.prompt) {
      try {
        window.google.accounts.id.prompt()
      } catch (promptError) {
        // FedCM/COOP errors are expected in some browsers and don't affect functionality
        // These are already suppressed in index.html
      }
    }
  } catch (error) {
    console.error('[google-auth] Failed to render button', error)
    authError.value = 'Failed to load Google Sign-In. Please try refreshing the page or check your browser settings.'
  }
}

const signOut = () => {
  idToken.value = null
  user.value = null
  localStorage.removeItem(STORAGE_KEY)
  window.google?.accounts?.id?.disableAutoSelect()
}

const isAuthenticated = computed(() => Boolean(idToken.value))

export function useGoogleAuth() {
  return {
    clientId,
    user,
    idToken,
    isAuthenticated,
    ready,
    authError,
    renderGoogleButton,
    signOut,
  }
}

