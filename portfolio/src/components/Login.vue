<script setup>
import { ref, onMounted, watch } from 'vue'
import { LogOut, Shield, User } from 'lucide-vue-next'
import { useGoogleAuth } from '../composables/useGoogleAuth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const { user, idToken, isAuthenticated, renderGoogleButton, signOut, authError } = useGoogleAuth()
const googleButtonRef = ref(null)
const account = ref(null)
const loading = ref(false)
const error = ref('')

const fetchAccountInfo = async () => {
  if (!idToken.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: idToken.value }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get account info')
    }

    account.value = data.account
  } catch (err) {
    error.value = err.message
    console.error('[Login] Error fetching account', err)
  } finally {
    loading.value = false
  }
}

const initGoogleButton = async () => {
  if (!googleButtonRef.value) return
  googleButtonRef.value.innerHTML = ''
  await renderGoogleButton(googleButtonRef.value, {
    type: 'standard',
    theme: 'filled_blue',
    size: 'large',
  })
}

const handleSignOut = () => {
  signOut()
  account.value = null
}

onMounted(() => {
  if (!isAuthenticated.value) {
    initGoogleButton()
  } else {
    fetchAccountInfo()
  }
})

watch(isAuthenticated, (value) => {
  if (value) {
    fetchAccountInfo()
  } else {
    account.value = null
    initGoogleButton()
  }
})
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 py-24 px-4">
    <div class="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl"></div>
    <div class="pointer-events-none absolute bottom-0 left-0 h-72 w-72 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-200/30 blur-3xl"></div>

    <div class="container-main relative">
      <div class="mx-auto max-w-md">
        <div class="rounded-[34px] border border-blue-100 bg-white/95 p-8 shadow-2xl backdrop-blur">
          <div class="space-y-6">
            <div class="text-center space-y-2">
              <h2 class="text-3xl font-bold text-slate-900">Account Login</h2>
              <p class="text-sm text-slate-600">
                Sign in with your Google account to access your profile
              </p>
            </div>

            <div v-if="!isAuthenticated" class="space-y-4">
              <div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
                <p class="text-sm font-semibold text-slate-700 mb-4 text-center">
                  Sign in to continue
                </p>
                <div ref="googleButtonRef" class="flex justify-center"></div>
                <p v-if="authError" class="mt-3 text-xs text-red-600 text-center">{{ authError }}</p>
              </div>
            </div>

            <div v-else-if="loading" class="text-center py-8">
              <p class="text-sm text-slate-600">Loading account information...</p>
            </div>

            <div v-else-if="account" class="space-y-4">
              <div class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <div class="flex items-center gap-4 mb-4">
                  <img
                    v-if="account.avatar_url"
                    :src="account.avatar_url"
                    alt="Profile photo"
                    class="h-16 w-16 rounded-full border-2 border-white object-cover shadow-lg"
                  />
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-slate-900">{{ account.name }}</h3>
                    <p class="text-sm text-slate-600">{{ account.email }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 border border-blue-100">
                  <component
                    :is="account.role?.name === 'admin' ? Shield : User"
                    :size="18"
                    class="text-blue-600"
                  />
                  <div class="flex-1">
                    <p class="text-xs font-semibold uppercase tracking-wider text-blue-500">
                      {{ account.role?.name || 'user' }}
                    </p>
                    <p class="text-xs text-slate-600">{{ account.role?.description || '' }}</p>
                  </div>
                </div>

                <div class="mt-4 pt-4 border-t border-blue-100 space-y-2 text-xs text-slate-500">
                  <p>Account ID: {{ account.id }}</p>
                  <p>Member since: {{ new Date(account.created_at).toLocaleDateString() }}</p>
                </div>
              </div>

              <button
                @click="handleSignOut"
                class="w-full inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <LogOut :size="16" />
                Sign out
              </button>
            </div>

            <div v-if="error" class="rounded-lg bg-red-50 border border-red-200 p-3">
              <p class="text-sm text-red-600">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.container-main {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

