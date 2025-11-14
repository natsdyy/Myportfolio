import { ref, computed } from 'vue'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const user = ref(null)
const idToken = ref(null)
const ready = ref(false)
const authError = ref(null)

let initialized = false
let waitingForGoogle = false

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
  }
}

const initializeClient = async () => {
  if (initialized || !clientId) return

  await waitForGoogle()

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
    ux_mode: 'popup',
  })

  initialized = true
  ready.value = true
}

const renderGoogleButton = async (element, options = {}) => {
  if (!element) return
  if (!clientId) {
    authError.value = 'Missing VITE_GOOGLE_CLIENT_ID'
    return
  }

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

  window.google.accounts.id.prompt()
}

const signOut = () => {
  idToken.value = null
  user.value = null
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

