<script setup>
import { ref, onMounted, watch } from 'vue'
import { Mail, Phone, Facebook } from 'lucide-vue-next'
import { useGoogleAuth } from '../../composables/useGoogleAuth'
import axios from 'axios'

const { user, idToken, isAuthenticated, renderGoogleButton, signOut } = useGoogleAuth()
const googleButtonRef = ref(null)

const form = ref({ subject: '', message: '' })
const status = ref({ loading: false, success: false, error: '' })

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'charleslouiealvaran@gmail.com', link: 'mailto:charleslouiealvaran@gmail.com' },
  { icon: Phone, label: 'Phone', value: '+63 929 856 8415', link: 'tel:+639298568415' },
  { icon: Facebook, label: 'Facebook', value: 'facebook.com/CharlesLouieAlvaran', link: 'https://www.facebook.com/CharlesLouieAlvaran/' }
]

// Load reCAPTCHA
onMounted(() => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (siteKey) {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }
})

const handleSubmit = async (e) => {
  e.preventDefault()
  if (!isAuthenticated.value) {
    status.value.error = 'Please sign in with Google first.'
    return
  }

  status.value.loading = true
  status.value.error = ''
  status.value.success = false

  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
    if (!siteKey) throw new Error('reCAPTCHA site key not configured')

    // Get reCAPTCHA token
    const recaptchaToken = await new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error('reCAPTCHA not loaded yet. Please wait.'))
        return
      }
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action: 'submit' })
          resolve(token)
        } catch (err) {
          reject(err)
        }
      })
    })

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    await axios.post(`${baseUrl}/api/contact`, {
      idToken: idToken.value,
      recaptchaToken,
      subject: form.value.subject,
      message: form.value.message
    })

    status.value.success = true
    form.value = { subject: '', message: '' }
    
    // Reset success after 5 seconds
    setTimeout(() => {
      status.value.success = false
    }, 5000)
    
  } catch (err) {
    console.error('Submission error:', err)
    status.value.error = err.response?.data?.error || err.message || 'Failed to send message. Please try again.'
  } finally {
    status.value.loading = false
  }
}

const initGoogleButton = async () => {
  if (!googleButtonRef.value) return
  googleButtonRef.value.innerHTML = ''
  await renderGoogleButton(googleButtonRef.value, { type: 'standard', theme: 'outline', size: 'large' })
}

onMounted(() => {
  if (!isAuthenticated.value) initGoogleButton()
})

watch(isAuthenticated, (val) => { if (!val) initGoogleButton() })
</script>

<template>
  <section class="relative py-32 px-4 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Background Accents -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-blue-600/5 blur-[180px] rounded-full pointer-events-none"></div>

    <div class="container-main relative">
      <div class="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-20 items-start">
        <!-- Contact Info -->
        <div class="space-y-12">
          <div class="space-y-6">
            <div class="inline-flex items-center gap-3">
              <span class="h-px w-8 bg-blue-600"></span>
              <span class="text-xs font-black uppercase tracking-[0.4em] text-blue-600">Contact</span>
            </div>
            <h2 class="text-5xl lg:text-7xl font-black text-main leading-[1] tracking-tighter">
              Start the <br /><span class="text-blue-600">Dialogue.</span>
            </h2>
            <p class="text-lg text-muted font-medium max-w-sm">
              Ready to bring your vision to life? Reach out and let's discuss how I can contribute to your team.
            </p>
          </div>

          <div class="space-y-4">
            <a 
              v-for="info in contactInfo" 
              :key="info.label"
              :href="info.link"
              class="group flex items-center gap-6 p-6 rounded-3xl border border-main bg-card-custom shadow-sm transition-all hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-xl cursor-pointer"
            >
              <div class="h-12 w-12 rounded-2xl bg-slate-50/50 border border-main flex items-center justify-center text-muted group-hover:bg-blue-600 group-hover:text-white transition-all">
                <component :is="info.icon" :size="20" />
              </div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">{{ info.label }}</p>
                <p class="text-sm font-bold text-main">{{ info.value }}</p>
              </div>
            </a>
          </div>
        </div>

        <!-- Form Side -->
        <div class="relative">
          <div class="absolute -inset-4 rounded-[3rem] bg-card-custom -z-10 blur-xl opacity-50"></div>
          <form
            @submit="handleSubmit"
            class="relative space-y-8 p-10 rounded-[2.5rem] bg-card-custom border border-main shadow-2xl backdrop-blur-xl"
          >
            <div class="space-y-2">
              <h3 class="text-3xl font-black text-main">Message</h3>
              <p class="text-sm text-muted font-medium">Please sign in with Google to enable the secure message relay.</p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-50/50 border border-main">
              <template v-if="isAuthenticated">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <img v-if="user?.picture" :src="user.picture" class="h-10 w-10 rounded-full" />
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-muted">Signed in as</p>
                      <p class="text-sm font-bold text-main">{{ user?.name }}</p>
                    </div>
                  </div>
                  <button type="button" @click="signOut" class="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-400 cursor-pointer">Sign Out</button>
                </div>
              </template>
              <template v-else>
                <div ref="googleButtonRef" class="flex justify-center"></div>
              </template>
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-muted">Subject</label>
                <input
                  v-model="form.subject"
                  type="text"
                  placeholder="The scope of your project"
                  class="w-full p-4 rounded-2xl border border-main bg-slate-50/50 outline-none focus:border-blue-600 focus:bg-card-custom transition-all font-bold text-main placeholder:text-slate-300"
                  :disabled="!isAuthenticated"
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-muted">Details</label>
                <textarea
                  v-model="form.message"
                  rows="4"
                  placeholder="Tell me more about what you're building..."
                  class="w-full p-4 rounded-2xl border border-main bg-slate-50/50 outline-none focus:border-blue-600 focus:bg-card-custom transition-all font-bold text-main resize-none placeholder:text-slate-300"
                  :disabled="!isAuthenticated"
                  required
                ></textarea>
              </div>
            </div>

            <div v-if="status.error" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-pulse">
              {{ status.error }}
            </div>

            <button
              type="submit"
              :disabled="!isAuthenticated || status.loading"
              class="w-full py-4 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-[0.3em] transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-500/20"
            >
              <span v-if="status.loading">Transmitting...</span>
              <span v-else-if="status.success">Sent Successfully ✓</span>
              <span v-else>Send Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
