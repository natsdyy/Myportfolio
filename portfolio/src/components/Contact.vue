<script setup>
import { ref, onMounted, watch } from 'vue'
import { Mail, Phone, MapPin, Send, Facebook, Instagram, LogOut } from 'lucide-vue-next'
import { useGoogleAuth } from '../composables/useGoogleAuth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

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
    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: idToken.value,
        subject: form.value.subject || null,
        message: form.value.message
      })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message')
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
})

watch(isAuthenticated, (value) => {
  if (!value) {
    initGoogleButton()
  }
})

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'charleslouiealvaran@gmail.com', link: 'mailto:charleslouiealvaran@gmail.com', span: 'full' },
  { icon: Phone, label: 'Phone', value: '+63 929 856 8415', link: 'tel:+639298568415' },
  { icon: Facebook, label: 'Facebook', value: 'facebook.com/CharlesLouieAlvaran', link: 'https://www.facebook.com/CharlesLouieAlvaran/', span: 'wide' },
  { icon: Instagram, label: 'Instagram', value: '@natsdyyy', link: 'https://www.instagram.com/natsdyyy/' },
  { icon: MapPin, label: 'Location', value: 'Dasmariñas City, Cavite, Philippines', link: 'https://maps.app.goo.gl/', span: 'full' }
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
                <p class="break-words text-sm font-semibold leading-snug text-slate-900 sm:text-base sm:leading-relaxed">
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

          <label class="space-y-2 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            Subject (optional)
            <input
              v-model="form.subject"
              type="text"
              placeholder="Collaboration, freelance, etc."
              class="w-full rounded-2xl border border-blue-100 bg-white/80 px-5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              :disabled="!isAuthenticated"
            />
          </label>

          <label class="space-y-2 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            Message
            <textarea
              v-model="form.message"
              rows="5"
              placeholder="Tell me about your project..."
              class="w-full resize-none rounded-2xl border border-blue-100 bg-white/80 px-5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              :disabled="!isAuthenticated"
              required
            ></textarea>
          </label>

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
