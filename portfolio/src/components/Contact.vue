<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Mail, Phone, MapPin, Send, Facebook, Instagram, LogOut } from 'lucide-vue-next'
import { useGoogleAuth } from '../composables/useGoogleAuth'

// If VITE_API_BASE_URL is not set, use same origin (backend serves frontend)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeQLw0sAAAAAJRLg2dc_KWfYx7g4KddAK-JRROi'

// Debug: Log site key (first 10 chars only for security)
if (import.meta.env.DEV) {
  console.log('reCAPTCHA Site Key loaded:', RECAPTCHA_SITE_KEY.substring(0, 10) + '...')
}

const form = ref({
  subject: '',
  message: ''
})

const status = ref({
  loading: false,
  success: false,
  error: ''
})

const { user, idToken, isAuthenticated, renderGoogleButton, signOut, authError } = useGoogleAuth()
const googleButtonRef = ref(null)
const recaptchaLoaded = ref(false)

// Load reCAPTCHA v3 script (invisible, no widget needed)
const loadRecaptchaScript = () => {
  // Check if script already exists
  if (document.querySelector(`script[src*="recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}"]`)) {
    // Script exists, wait for it to be ready
    if (window.grecaptcha && window.grecaptcha.ready) {
      window.grecaptcha.ready(() => {
        recaptchaLoaded.value = true
      })
    } else {
      // Wait for grecaptcha to be available
      const checkInterval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          clearInterval(checkInterval)
          window.grecaptcha.ready(() => {
            recaptchaLoaded.value = true
          })
        }
      }, 100)
      setTimeout(() => clearInterval(checkInterval), 10000)
    }
    return
  }

  // Create and load the script
  const script = document.createElement('script')
  script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
  script.async = true
  script.defer = true
  
  script.onload = () => {
    // Wait for grecaptcha to be ready
    if (window.grecaptcha && window.grecaptcha.ready) {
      window.grecaptcha.ready(() => {
        recaptchaLoaded.value = true
      })
    } else {
      // Fallback: wait a bit for grecaptcha to initialize
      setTimeout(() => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            recaptchaLoaded.value = true
          })
        } else {
          recaptchaLoaded.value = true // Assume ready if grecaptcha exists
        }
      }, 500)
    }
  }
  
  script.onerror = () => {
    console.error('Failed to load reCAPTCHA script')
    status.value.error = 'Failed to load reCAPTCHA. Please refresh the page.'
  }
  
  document.head.appendChild(script)
}

// Execute reCAPTCHA v3 and get token
const getRecaptchaToken = async () => {
  if (!window.grecaptcha) {
    console.error('reCAPTCHA not loaded')
    return null
  }

  try {
    // Use grecaptcha.ready() to ensure it's fully loaded
    return new Promise((resolve, reject) => {
      if (window.grecaptcha.ready) {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
            resolve(token)
          } catch (error) {
            console.error('Error executing reCAPTCHA:', error)
            reject(error)
          }
        })
      } else {
        // Fallback: try to execute directly
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
          .then(resolve)
          .catch(reject)
      }
    })
  } catch (error) {
    console.error('Error executing reCAPTCHA:', error)
    return null
  }
}

const handleSubmit = async (e) => {
  e.preventDefault()
  status.value.error = ''
  status.value.success = false

  if (!isAuthenticated.value || !idToken.value) {
    status.value.error = 'Please sign in with Google to send a message.'
    return
  }

  status.value.loading = true

  try {
    // Get reCAPTCHA v3 token (invisible, executed on submit)
    if (!recaptchaLoaded.value) {
      status.value.error = 'reCAPTCHA is still loading. Please wait a moment and try again.'
      status.value.loading = false
      return
    }

    const recaptchaToken = await getRecaptchaToken()
    if (!recaptchaToken) {
      status.value.error = 'reCAPTCHA verification failed. Please check your browser console or try refreshing the page.'
      status.value.loading = false
      return
    }

    console.log('[contact] Sending request to:', `${API_BASE_URL}/api/contact`)
    console.log('[contact] Request payload:', {
      hasIdToken: !!idToken.value,
      hasRecaptchaToken: !!recaptchaToken,
      hasMessage: !!form.value.message,
      subject: form.value.subject
    })

    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: idToken.value,
        recaptchaToken: recaptchaToken,
        subject: form.value.subject || null,
        message: form.value.message
      })
    })

    console.log('[contact] Response status:', response.status, response.statusText)

    const data = await response.json().catch((parseError) => {
      console.error('[contact] Failed to parse response:', parseError)
      return { error: 'Invalid response from server' }
    })

    console.log('[contact] Response data:', data)

    if (!response.ok) {
      let errorMessage = data.error || `Server error: ${response.status} ${response.statusText}`
      
      // Provide helpful error messages for common issues
      if (response.status === 405) {
        errorMessage = 'API endpoint not found. Please check that the backend service is deployed and VITE_API_BASE_URL is set correctly.'
      } else if (response.status === 404) {
        errorMessage = 'Backend API not found. Please verify VITE_API_BASE_URL points to your backend service domain.'
      }
      
      console.error('[contact] Request failed:', errorMessage)
      throw new Error(errorMessage)
    }

    status.value.success = true
    form.value.subject = ''
    form.value.message = ''
  } catch (error) {
    status.value.error = error.message
  } finally {
    status.value.loading = false
  }
}

const initGoogleButton = async () => {
  if (!googleButtonRef.value) return
  googleButtonRef.value.innerHTML = ''
  await renderGoogleButton(googleButtonRef.value, { type: 'standard', theme: 'filled_blue', size: 'large' })
}

onMounted(() => {
  if (!isAuthenticated.value) {
    initGoogleButton()
  }
  // Load reCAPTCHA script on mount
  if (RECAPTCHA_SITE_KEY) {
    loadRecaptchaScript()
  } else {
    console.warn('reCAPTCHA site key not found in environment variables')
  }
})

watch(isAuthenticated, (value) => {
  if (!value) {
    initGoogleButton()
  }
})

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'lithauzs@gmail.com', link: 'mailto:lithauzs@gmail.com', span: 'full' },
  { icon: Phone, label: 'Phone', value: '+63 917 543 8921', link: 'tel:+639175438921', noWrap: true, span: 'full' },
  { icon: Facebook, label: 'Facebook', value: 'facebook.com/LithauzsMart', link: 'https://www.facebook.com/LithauzsMart/', span: 'wide' },
  { icon: Instagram, label: 'Instagram', value: '@lithauzs.dev', link: 'https://www.instagram.com/lithauzs.dev/' },
  { icon: MapPin, label: 'Location', value: 'Philippines', link: 'https://maps.app.goo.gl/', span: 'full' }
]
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 py-24 px-4">
    <div class="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl"></div>
    <div class="pointer-events-none absolute bottom-0 left-0 h-72 w-72 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-200/30 blur-3xl"></div>

    <div class="container-main relative">
      <div class="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div class="space-y-10">
          <div class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
              Let's connect
            </p>
            <h2 class="text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
              Have a project or idea? I’m ready to collaborate.
            </h2>
            <p class="text-base leading-relaxed text-slate-600 lg:text-lg">
              Whether you’re planning a new product or refining an existing experience, I can help bring clarity, polish, and momentum. Share a few details and I’ll get back to you soon.
            </p>
      </div>
      
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              v-for="info in contactInfo"
              :key="info.label"
              :href="info.link"
              :class="[
                'group flex w-full items-start gap-6 rounded-3xl border border-blue-100 bg-white/90 px-8 py-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                info.span === 'full' ? 'sm:col-span-2' : '',
                info.span === 'wide' ? 'sm:col-span-2 lg:col-span-2' : ''
              ]"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <component :is="info.icon" :size="22" />
              </div>
              <div class="space-y-1 min-w-0">
                <p class="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-blue-400">
                  {{ info.label }}
                </p>
                <p
                  :class="[
                    'text-sm font-semibold leading-snug text-slate-950 sm:text-base sm:leading-relaxed',
                    info.noWrap ? 'whitespace-nowrap' : 'break-words'
                  ]"
                >
                  {{ info.value }}
                </p>
              </div>
            </a>
          </div>
        </div>

        <form
          @submit="handleSubmit"
          class="flex flex-col gap-6 rounded-[34px] border border-blue-100 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10"
        >
          <div class="space-y-2">
            <h3 class="text-2xl font-semibold text-slate-900">Send a message</h3>
            <p class="text-sm text-slate-500">
              Sign in with Google so I can reply to the email that’s attached to your account.
            </p>
          </div>

          <div class="rounded-3xl border border-blue-100 bg-blue-50/60 p-4">
            <template v-if="isAuthenticated">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-4">
                  <img
                    v-if="user?.picture"
                    :src="user.picture"
                    alt="Profile photo"
                    class="h-12 w-12 rounded-full border border-white object-cover shadow"
                  />
                  <div>
                    <p class="text-sm font-semibold text-slate-900">Signed in as</p>
                    <p class="text-base font-semibold text-blue-700">{{ user?.name }}</p>
                    <p class="text-xs text-slate-600">{{ user?.email }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="signOut"
                  class="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 sm:mt-0"
                >
                  <LogOut :size="16" />
                  Sign out
                </button>
              </div>
            </template>
            <template v-else>
              <p class="text-sm font-semibold text-slate-700">Sign in to unlock the contact form.</p>
              <p class="text-xs text-slate-500 mb-3">I’ll only use your Google email to reply.</p>
              <div ref="googleButtonRef" class="flex justify-start"></div>
              <p v-if="authError" class="mt-2 text-xs text-red-600">{{ authError }}</p>
            </template>
          </div>

          <label class="space-y-2 block">
            <span class="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 block mb-1.5">Subject (optional)</span>
            <input
              v-model="form.subject"
              type="text"
              placeholder="Collaboration, freelance, etc."
              class="w-full rounded-2xl border border-blue-100 bg-white/80 px-5 py-3 text-base font-normal text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
              :disabled="!isAuthenticated"
            />
          </label>

          <label class="space-y-2 block">
            <span class="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 block mb-1.5">Message</span>
            <textarea
              v-model="form.message"
              rows="5"
              placeholder="Tell me about your project..."
              class="w-full resize-none rounded-2xl border border-blue-100 bg-white/80 px-5 py-3 text-base font-normal text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
              :disabled="!isAuthenticated"
              required
            ></textarea>
          </label>

          <!-- reCAPTCHA v3 indicator and badge -->
          <div v-if="isAuthenticated" class="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <div class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full" :class="recaptchaLoaded ? 'bg-green-500' : 'bg-amber-500 animate-pulse'"></div>
              <p class="text-xs font-medium text-slate-600">
                {{ recaptchaLoaded ? 'Protected by reCAPTCHA' : 'Loading security check...' }}
              </p>
            </div>
            <!-- reCAPTCHA v3 badge (required by Google) -->
            <div class="text-xs text-slate-500">
              This site is protected by reCAPTCHA and the Google 
              <a href="https://policies.google.com/privacy" target="_blank" class="text-blue-600 hover:underline">Privacy Policy</a> and 
              <a href="https://policies.google.com/terms" target="_blank" class="text-blue-600 hover:underline">Terms of Service</a> apply.
            </div>
          </div>

          <div class="space-y-2">
            <button
              type="submit"
              :disabled="!isAuthenticated || status.loading"
              class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition duration-300 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send :size="18" v-if="!status.success" />
              <span v-if="status.loading">Sending...</span>
              <span v-else-if="status.success">Message Sent ✓</span>
              <span v-else>Send Message</span>
            </button>
            <p v-if="status.error" class="text-sm font-semibold text-red-600">{{ status.error }}</p>
            <p v-else-if="status.success" class="text-sm font-semibold text-green-600">
              Thanks for reaching out! I’ll reply soon.
            </p>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
