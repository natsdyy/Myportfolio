<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { LogOut, Shield, User, LogIn, UserPlus, Mail, Lock, Phone, UserCircle, Eye, EyeOff, ChevronDown } from 'lucide-vue-next'
import { useGoogleAuth } from '../composables/useGoogleAuth'
import { countries, getCountryByCode } from '../data/countries'

// If VITE_API_BASE_URL is not set, use same origin (backend serves frontend)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const { user, idToken, isAuthenticated, renderGoogleButton, signOut, authError } = useGoogleAuth()
const googleButtonRef = ref(null)
const googleSignUpButtonRef = ref(null)
const activeTab = ref('login')
const account = ref(null)
const needsProfileCompletion = ref(false)
const isEditingProfile = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

// Form states
const loginForm = ref({
  email: '',
  password: ''
})

const signupForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  countryCode: 'PH'
})

// Profile completion form for Google sign-ups
const profileCompletionForm = ref({
  username: '',
  phone: '',
  countryCode: 'PH'
})
const profileCompletionErrors = ref({})

// Profile edit form
const profileEditForm = ref({
  name: '',
  password: '',
  confirmPassword: '',
  currentPassword: ''
})
const profileEditErrors = ref({})
const showEditPassword = ref(false)
const showEditCurrentPassword = ref(false)
const showEditConfirmPassword = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const countryDropdownOpen = ref(false)
const profileCountryDropdownOpen = ref(false)
const selectedCountry = computed(() => getCountryByCode(signupForm.value.countryCode))
const selectedProfileCountry = computed(() => getCountryByCode(profileCompletionForm.value.countryCode))

// Form validation
const signupErrors = ref({})
const loginErrors = ref({})

const validateSignup = () => {
  signupErrors.value = {}
  
  if (!signupForm.value.username || signupForm.value.username.length < 3) {
    signupErrors.value.username = 'Username must be at least 3 characters'
  }
  
  if (!signupForm.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.value.email)) {
    signupErrors.value.email = 'Please enter a valid email'
  }
  
  if (!signupForm.value.password || signupForm.value.password.length < 6) {
    signupErrors.value.password = 'Password must be at least 6 characters'
  }
  
  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    signupErrors.value.confirmPassword = 'Passwords do not match'
  }
  
  const phoneDigits = signupForm.value.phone.replace(/\D/g, '')
  if (!phoneDigits || phoneDigits.length < selectedCountry.value.maxLength) {
    signupErrors.value.phone = `Phone number must be ${selectedCountry.value.maxLength} digits`
  }
  
  return Object.keys(signupErrors.value).length === 0
}

const validateLogin = () => {
  loginErrors.value = {}
  
  if (!loginForm.value.email) {
    loginErrors.value.email = 'Email is required'
  }
  
  if (!loginForm.value.password) {
    loginErrors.value.password = 'Password is required'
  }
  
  return Object.keys(loginErrors.value).length === 0
}

const validateProfileCompletion = () => {
  profileCompletionErrors.value = {}
  
  if (!profileCompletionForm.value.username || profileCompletionForm.value.username.length < 3) {
    profileCompletionErrors.value.username = 'Username must be at least 3 characters'
  }
  
  const phoneDigits = profileCompletionForm.value.phone.replace(/\D/g, '')
  if (!phoneDigits || phoneDigits.length < selectedProfileCountry.value.maxLength) {
    profileCompletionErrors.value.phone = `Phone number must be ${selectedProfileCountry.value.maxLength} digits`
  }
  
  return Object.keys(profileCompletionErrors.value).length === 0
}

const validateProfileEdit = () => {
  profileEditErrors.value = {}
  
  if (!profileEditForm.value.name || profileEditForm.value.name.trim().length < 2) {
    profileEditErrors.value.name = 'Name must be at least 2 characters'
  }
  
  // If password is being changed, validate it
  if (profileEditForm.value.password) {
    if (profileEditForm.value.password.length < 6) {
      profileEditErrors.value.password = 'Password must be at least 6 characters'
    }
    
    if (profileEditForm.value.password !== profileEditForm.value.confirmPassword) {
      profileEditErrors.value.confirmPassword = 'Passwords do not match'
    }
    
    if (!profileEditForm.value.currentPassword) {
      profileEditErrors.value.currentPassword = 'Current password is required to change password'
    }
  }
  
  return Object.keys(profileEditErrors.value).length === 0
}

const handleSignup = async (e) => {
  e.preventDefault()
  error.value = ''
  success.value = ''
  
  if (!validateSignup()) {
    return
  }
  
  loading.value = true
  
  try {
    const phoneDigits = signupForm.value.phone.replace(/\D/g, '')
    const fullPhone = `${selectedCountry.value.dialCode}${phoneDigits}`
    
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: signupForm.value.username,
        email: signupForm.value.email,
        password: signupForm.value.password,
        phone: fullPhone,
        countryCode: signupForm.value.countryCode
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Sign up failed')
    }
    
    success.value = 'Account created successfully! Please log in.'
    signupForm.value = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      countryCode: 'PH'
    }
    activeTab.value = 'login'
    loginForm.value.email = data.email || signupForm.value.email
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleLogin = async (e) => {
  e.preventDefault()
  error.value = ''
  success.value = ''
  
  if (!validateLogin()) {
    return
  }
  
  loading.value = true
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginForm.value.email,
        password: loginForm.value.password
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }
    
    // Store token and fetch account info
    if (data.token) {
      // For now, we'll use a simple approach - in production use httpOnly cookies
      localStorage.setItem('auth_token', data.token)
      await fetchAccountInfo(data.token)
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const fetchAccountInfo = async (token = null) => {
  // Check for Google idToken first (from useGoogleAuth)
  const googleIdToken = idToken.value
  const authToken = token || localStorage.getItem('auth_token')
  
  // If no token at all, return early
  if (!googleIdToken && !authToken) return
  
  loading.value = true
  error.value = ''
  
  try {
    let response
    
    // If we have Google idToken, use POST /api/auth/me with idToken in body
    if (googleIdToken) {
      response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken: googleIdToken })
      })
    } else {
      // Otherwise use GET /api/auth/me with JWT token in Authorization header
      response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      })
    }
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get account info')
    }
    
    account.value = data.account
    needsProfileCompletion.value = data.needsProfileCompletion || false
    
    // Pre-fill profile completion form if needed
    if (needsProfileCompletion.value && user.value) {
      profileCompletionForm.value.email = user.value.email || account.value.email
    }
    
    // If we got account info from Google sign-in, also save a JWT token if provided
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
    }
  } catch (err) {
    error.value = err.message
    // Only clear localStorage token if it was a JWT auth failure
    if (!googleIdToken && authToken) {
      localStorage.removeItem('auth_token')
    }
    
    // If we have Google auth but backend failed, show basic account info from Google
    if (googleIdToken && user.value) {
      account.value = {
        id: user.value.email, // Use email as temporary ID
        name: user.value.name,
        email: user.value.email,
        avatar_url: user.value.picture,
        role: { name: 'user', description: 'Regular user' }
      }
      // Check if profile needs completion (no username or phone in Google data)
      needsProfileCompletion.value = true
      profileCompletionForm.value.email = user.value.email
      error.value = 'Connected with Google, but unable to sync with server. Please complete your profile.'
    }
  } finally {
    loading.value = false
  }
}

const formatPhoneInput = (value) => {
  const digits = value.replace(/\D/g, '')
  const maxLength = selectedCountry.value.maxLength
  return digits.slice(0, maxLength)
}

const initGoogleButton = async (ref, isSignUp = false) => {
  if (!ref) return
  ref.innerHTML = ''
  await renderGoogleButton(ref, {
    type: 'standard',
    theme: isSignUp ? 'outline' : 'filled_blue',
    size: 'large',
    text: isSignUp ? 'signup_with' : 'signin_with',
  })
}

const initButtons = async () => {
  if (!isAuthenticated.value) {
    if (activeTab.value === 'login' && googleButtonRef.value) {
      await initGoogleButton(googleButtonRef.value, false)
    } else if (activeTab.value === 'signup' && googleSignUpButtonRef.value) {
      await initGoogleButton(googleSignUpButtonRef.value, true)
    }
  }
}

const handleCompleteProfile = async (e) => {
  e.preventDefault()
  error.value = ''
  success.value = ''
  
  if (!validateProfileCompletion()) {
    return
  }
  
  if (!idToken.value) {
    error.value = 'Google authentication required'
    return
  }
  
  loading.value = true
  
  try {
    const phoneDigits = profileCompletionForm.value.phone.replace(/\D/g, '')
    const fullPhone = `${selectedProfileCountry.value.dialCode}${phoneDigits}`
    
    const response = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: idToken.value,
        username: profileCompletionForm.value.username,
        phone: fullPhone,
        countryCode: profileCompletionForm.value.countryCode
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to complete profile')
    }
    
    account.value = data.account
    needsProfileCompletion.value = false
    success.value = data.message || 'Profile completed successfully!'
    
    // Clear form
    profileCompletionForm.value = {
      username: '',
      phone: '',
      countryCode: 'PH'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleEditProfile = () => {
  isEditingProfile.value = true
  profileEditForm.value = {
    name: account.value?.name || '',
    password: '',
    confirmPassword: '',
    currentPassword: ''
  }
  profileEditErrors.value = {}
  error.value = ''
  success.value = ''
}

const handleCancelEdit = () => {
  isEditingProfile.value = false
  profileEditForm.value = {
    name: '',
    password: '',
    confirmPassword: '',
    currentPassword: ''
  }
  profileEditErrors.value = {}
}

const handleUpdateProfile = async (e) => {
  e.preventDefault()
  error.value = ''
  success.value = ''
  
  if (!validateProfileEdit()) {
    return
  }
  
  loading.value = true
  
  try {
    let response
    
    // Check if user is authenticated via Google or JWT
    if (idToken.value) {
      // Google user - can only update name
      if (profileEditForm.value.password) {
        error.value = 'Google sign-in users cannot set a password. Please use Google to sign in.'
        loading.value = false
        return
      }
      
      response = await fetch(`${API_BASE_URL}/api/auth/profile/google`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: idToken.value,
          name: profileEditForm.value.name
        }),
      })
    } else {
      // JWT user - can update name and password
      const authToken = localStorage.getItem('auth_token')
      if (!authToken) {
        throw new Error('Not authenticated')
      }
      
      const body = {
        name: profileEditForm.value.name
      }
      
      // Only include password fields if password is being changed
      if (profileEditForm.value.password) {
        body.password = profileEditForm.value.password
        body.currentPassword = profileEditForm.value.currentPassword
      }
      
      response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      })
    }
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile')
    }
    
    account.value = data.account
    isEditingProfile.value = false
    success.value = data.message || 'Profile updated successfully!'
    
    // Clear form
    profileEditForm.value = {
      name: '',
      password: '',
      confirmPassword: '',
      currentPassword: ''
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleSignOut = () => {
  signOut()
  account.value = null
  needsProfileCompletion.value = false
  isEditingProfile.value = false
  localStorage.removeItem('auth_token')
}

onMounted(() => {
  // Check for existing JWT token first
  const token = localStorage.getItem('auth_token')
  if (token) {
    fetchAccountInfo(token)
  } else if (isAuthenticated.value) {
    // If Google authenticated, fetch account info
    fetchAccountInfo()
  } else {
    // Not authenticated, show login buttons
    initButtons()
  }
})

watch(isAuthenticated, (value) => {
  if (value) {
    fetchAccountInfo()
  } else {
    account.value = null
    initButtons()
  }
})

watch(activeTab, () => {
  if (!isAuthenticated.value) {
    initButtons()
    error.value = ''
    success.value = ''
  }
})

watch(() => signupForm.value.phone, (newVal) => {
  signupForm.value.phone = formatPhoneInput(newVal)
})

watch(() => profileCompletionForm.value.phone, (newVal) => {
  const digits = newVal.replace(/\D/g, '')
  const maxLength = selectedProfileCountry.value.maxLength
  profileCompletionForm.value.phone = digits.slice(0, maxLength)
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
            <!-- Tabs -->
            <div v-if="!account" class="flex gap-2 rounded-2xl border border-blue-100 bg-blue-50/30 p-1">
              <button
                @click="activeTab = 'login'"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  activeTab === 'login'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-slate-600 hover:text-blue-600'
                ]"
              >
                <LogIn :size="18" />
                Login
              </button>
              <button
                @click="activeTab = 'signup'"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  activeTab === 'signup'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-slate-600 hover:text-blue-600'
                ]"
              >
                <UserPlus :size="18" />
                Sign Up
              </button>
            </div>

            <!-- Login Form -->
            <form v-if="!account && activeTab === 'login'" @submit="handleLogin" class="space-y-4">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-slate-900">Welcome Back</h2>
                <p class="text-sm text-slate-600">Sign in to your account</p>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Email or Username
                  </label>
                  <div class="relative">
                    <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="loginForm.email"
                      type="text"
                      placeholder="Enter your email or username"
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': loginErrors.email }"
                    />
                  </div>
                  <p v-if="loginErrors.email" class="mt-1 text-xs text-red-600">{{ loginErrors.email }}</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="loginForm.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Enter your password"
                      class="w-full pl-10 pr-12 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': loginErrors.password }"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <Eye v-if="!showPassword" :size="18" />
                      <EyeOff v-else :size="18" />
                    </button>
                  </div>
                  <p v-if="loginErrors.password" class="mt-1 text-xs text-red-600">{{ loginErrors.password }}</p>
                </div>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="loading">Signing in...</span>
                <span v-else class="flex items-center justify-center gap-2">
                  <LogIn :size="18" />
                  Sign In
                </span>
              </button>

              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-blue-100"></div>
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                  <span class="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div ref="googleButtonRef" class="flex justify-center"></div>
                <p v-if="authError" class="mt-3 text-xs text-red-600 text-center">{{ authError }}</p>
              </div>
            </form>

            <!-- Sign Up Form -->
            <form v-if="!account && activeTab === 'signup'" @submit="handleSignup" class="space-y-4">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-slate-900">Create Account</h2>
                <p class="text-sm text-slate-600">Sign up to get started</p>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Username
                  </label>
                  <div class="relative">
                    <UserCircle class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="signupForm.username"
                      type="text"
                      placeholder="Choose a username"
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': signupErrors.username }"
                    />
                  </div>
                  <p v-if="signupErrors.username" class="mt-1 text-xs text-red-600">{{ signupErrors.username }}</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <div class="relative">
                    <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="signupForm.email"
                      type="email"
                      placeholder="Enter your email"
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': signupErrors.email }"
                    />
                  </div>
                  <p v-if="signupErrors.email" class="mt-1 text-xs text-red-600">{{ signupErrors.email }}</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="signupForm.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Create a password"
                      class="w-full pl-10 pr-12 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': signupErrors.password }"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <Eye v-if="!showPassword" :size="18" />
                      <EyeOff v-else :size="18" />
                    </button>
                  </div>
                  <p v-if="signupErrors.password" class="mt-1 text-xs text-red-600">{{ signupErrors.password }}</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="signupForm.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="Confirm your password"
                      class="w-full pl-10 pr-12 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': signupErrors.confirmPassword }"
                    />
                    <button
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <Eye v-if="!showConfirmPassword" :size="18" />
                      <EyeOff v-else :size="18" />
                    </button>
                  </div>
                  <p v-if="signupErrors.confirmPassword" class="mt-1 text-xs text-red-600">{{ signupErrors.confirmPassword }}</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <div class="flex gap-2">
                    <div class="relative flex-shrink-0">
                      <button
                        type="button"
                        @click="countryDropdownOpen = !countryDropdownOpen"
                        class="flex items-center gap-2 px-3 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 hover:border-blue-400 transition min-w-[140px]"
                      >
                        <span class="text-lg">{{ selectedCountry.flag }}</span>
                        <span class="text-sm font-medium">{{ selectedCountry.dialCode }}</span>
                        <ChevronDown :size="16" class="text-slate-400 ml-auto" :class="{ 'rotate-180': countryDropdownOpen }" />
                      </button>
                      <div
                        v-if="countryDropdownOpen"
                        class="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto rounded-xl border border-blue-100 bg-white shadow-xl z-50"
                      >
                        <div
                          v-for="country in countries"
                          :key="country.code"
                          @click="signupForm.countryCode = country.code; countryDropdownOpen = false"
                          class="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm flex items-center gap-3"
                          :class="{ 'bg-blue-50': signupForm.countryCode === country.code }"
                        >
                          <span class="text-xl flex-shrink-0">{{ country.flag }}</span>
                          <div class="flex-1 min-w-0">
                            <div class="font-medium text-slate-900">{{ country.name }}</div>
                            <div class="text-xs text-slate-500">{{ country.dialCode }} • {{ country.format }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="relative flex-1">
                      <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="signupForm.phone"
                        type="tel"
                        :placeholder="`Enter ${selectedCountry.maxLength} digits`"
                        class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        :class="{ 'border-red-300': signupErrors.phone }"
                        :maxlength="selectedCountry.maxLength"
                      />
                    </div>
                  </div>
                  <p v-if="signupErrors.phone" class="mt-1 text-xs text-red-600">{{ signupErrors.phone }}</p>
                  <p class="mt-1 text-xs text-slate-500">
                    Format: {{ selectedCountry.dialCode }} {{ selectedCountry.format }}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="loading">Creating account...</span>
                <span v-else class="flex items-center justify-center gap-2">
                  <UserPlus :size="18" />
                  Create Account
                </span>
              </button>

              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-blue-100"></div>
                </div>
                <div class="relative flex justify-center text-xs uppercase">
                  <span class="bg-white px-2 text-slate-500">Or sign up with</span>
                </div>
              </div>

              <div class="rounded-2xl border border-blue-100 bg-indigo-50/60 p-4">
                <div ref="googleSignUpButtonRef" class="flex justify-center"></div>
                <p v-if="authError" class="mt-3 text-xs text-red-600 text-center">{{ authError }}</p>
              </div>

              <p class="text-xs text-center text-slate-500">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

            <!-- Profile Completion Form (for Google sign-ups) -->
            <form v-if="account && needsProfileCompletion" @submit="handleCompleteProfile" class="space-y-4">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-slate-900">Complete Your Profile</h2>
                <p class="text-sm text-slate-600">Please provide additional information to complete your account</p>
              </div>

              <div class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 mb-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="account.avatar_url || user?.picture"
                    :src="account.avatar_url || user?.picture"
                    alt="Profile photo"
                    class="h-12 w-12 rounded-full border-2 border-white object-cover shadow-lg"
                  />
                  <div class="flex-1">
                    <h3 class="text-sm font-bold text-slate-900">{{ account.name || user?.name }}</h3>
                    <p class="text-xs text-slate-600">{{ account.email || user?.email }}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Username <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <UserCircle class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="profileCompletionForm.username"
                      type="text"
                      placeholder="Choose a username"
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': profileCompletionErrors.username }"
                    />
                  </div>
                  <p v-if="profileCompletionErrors.username" class="mt-1 text-xs text-red-600">{{ profileCompletionErrors.username }}</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-2">
                    <div class="relative flex-shrink-0">
                      <button
                        type="button"
                        @click="profileCountryDropdownOpen = !profileCountryDropdownOpen"
                        class="flex items-center gap-2 px-3 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 hover:border-blue-400 transition min-w-[140px]"
                      >
                        <span class="text-lg">{{ selectedProfileCountry.flag }}</span>
                        <span class="text-sm font-medium">{{ selectedProfileCountry.dialCode }}</span>
                        <ChevronDown :size="16" class="text-slate-400 ml-auto" :class="{ 'rotate-180': profileCountryDropdownOpen }" />
                      </button>
                      <div
                        v-if="profileCountryDropdownOpen"
                        class="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto rounded-xl border border-blue-100 bg-white shadow-xl z-50"
                      >
                        <div
                          v-for="country in countries"
                          :key="country.code"
                          @click="profileCompletionForm.countryCode = country.code; profileCountryDropdownOpen = false"
                          class="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm flex items-center gap-3"
                          :class="{ 'bg-blue-50': profileCompletionForm.countryCode === country.code }"
                        >
                          <span class="text-xl flex-shrink-0">{{ country.flag }}</span>
                          <div class="flex-1 min-w-0">
                            <div class="font-medium text-slate-900">{{ country.name }}</div>
                            <div class="text-xs text-slate-500">{{ country.dialCode }} • {{ country.format }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="relative flex-1">
                      <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="profileCompletionForm.phone"
                        type="tel"
                        :placeholder="`Enter ${selectedProfileCountry.maxLength} digits`"
                        class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        :class="{ 'border-red-300': profileCompletionErrors.phone }"
                        :maxlength="selectedProfileCountry.maxLength"
                      />
                    </div>
                  </div>
                  <p v-if="profileCompletionErrors.phone" class="mt-1 text-xs text-red-600">{{ profileCompletionErrors.phone }}</p>
                  <p class="mt-1 text-xs text-slate-500">
                    Format: {{ selectedProfileCountry.dialCode }} {{ selectedProfileCountry.format }}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="loading">Completing profile...</span>
                <span v-else class="flex items-center justify-center gap-2">
                  <UserPlus :size="18" />
                  Complete Profile
                </span>
              </button>
            </form>

            <!-- Profile Edit Form -->
            <form v-if="account && !needsProfileCompletion && isEditingProfile" @submit="handleUpdateProfile" class="space-y-4">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-slate-900">Edit Profile</h2>
                <p class="text-sm text-slate-600">Update your account information</p>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Name <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <UserCircle class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      v-model="profileEditForm.name"
                      type="text"
                      placeholder="Enter your name"
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      :class="{ 'border-red-300': profileEditErrors.name }"
                    />
                  </div>
                  <p v-if="profileEditErrors.name" class="mt-1 text-xs text-red-600">{{ profileEditErrors.name }}</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <div class="relative">
                    <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      :value="account.email"
                      type="email"
                      disabled
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p class="mt-1 text-xs text-slate-500">Email cannot be changed</p>
                </div>

                <div v-if="account.username">
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Username
                  </label>
                  <div class="relative">
                    <User class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input
                      :value="account.username"
                      type="text"
                      disabled
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-100 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p class="mt-1 text-xs text-slate-500">Username cannot be changed</p>
                </div>

                <!-- Password change section (only for JWT users, not Google) -->
                <div v-if="!idToken" class="space-y-4 pt-4 border-t border-blue-100">
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Current Password
                    </label>
                    <div class="relative">
                      <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="profileEditForm.currentPassword"
                        :type="showEditCurrentPassword ? 'text' : 'password'"
                        placeholder="Enter current password (required to change password)"
                        class="w-full pl-10 pr-12 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        :class="{ 'border-red-300': profileEditErrors.currentPassword }"
                      />
                      <button
                        type="button"
                        @click="showEditCurrentPassword = !showEditCurrentPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <Eye v-if="!showEditCurrentPassword" :size="18" />
                        <EyeOff v-else :size="18" />
                      </button>
                    </div>
                    <p v-if="profileEditErrors.currentPassword" class="mt-1 text-xs text-red-600">{{ profileEditErrors.currentPassword }}</p>
                    <p class="mt-1 text-xs text-slate-500">Leave blank if you don't want to change password</p>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <div class="relative">
                      <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="profileEditForm.password"
                        :type="showEditPassword ? 'text' : 'password'"
                        placeholder="Enter new password"
                        class="w-full pl-10 pr-12 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        :class="{ 'border-red-300': profileEditErrors.password }"
                      />
                      <button
                        type="button"
                        @click="showEditPassword = !showEditPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <Eye v-if="!showEditPassword" :size="18" />
                        <EyeOff v-else :size="18" />
                      </button>
                    </div>
                    <p v-if="profileEditErrors.password" class="mt-1 text-xs text-red-600">{{ profileEditErrors.password }}</p>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div class="relative">
                      <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="profileEditForm.confirmPassword"
                        :type="showEditConfirmPassword ? 'text' : 'password'"
                        placeholder="Confirm new password"
                        class="w-full pl-10 pr-12 py-3 rounded-xl border border-blue-100 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        :class="{ 'border-red-300': profileEditErrors.confirmPassword }"
                      />
                      <button
                        type="button"
                        @click="showEditConfirmPassword = !showEditConfirmPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <Eye v-if="!showEditConfirmPassword" :size="18" />
                        <EyeOff v-else :size="18" />
                      </button>
                    </div>
                    <p v-if="profileEditErrors.confirmPassword" class="mt-1 text-xs text-red-600">{{ profileEditErrors.confirmPassword }}</p>
                  </div>
                </div>

                <div v-if="idToken" class="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p class="text-xs text-blue-700">
                    <strong>Note:</strong> Google sign-in users cannot change their password. Please use Google to sign in.
                  </p>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  @click="handleCancelEdit"
                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading"
                  class="flex-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span v-if="loading">Updating...</span>
                  <span v-else>Save Changes</span>
                </button>
              </div>
            </form>

            <!-- Account Info (when logged in) -->
            <div v-if="account && !needsProfileCompletion && !isEditingProfile" class="space-y-4">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-slate-900">Your Account</h2>
                <p class="text-sm text-slate-600">Manage your profile and settings</p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <div class="flex items-center gap-4 mb-4">
                  <img
                    v-if="account.avatar_url"
                    :src="account.avatar_url"
                    alt="Profile photo"
                    class="h-16 w-16 rounded-full border-2 border-white object-cover shadow-lg"
                  />
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-slate-900">{{ account.name || account.username }}</h3>
                    <p class="text-sm text-slate-600">{{ account.email }}</p>
                  </div>
                </div>

                <div class="space-y-3 mb-4">
                  <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-white/80 border border-blue-100">
                    <div class="flex items-center gap-2">
                      <User class="text-blue-600" :size="18" />
                      <span class="text-sm font-medium text-slate-700">Name:</span>
                    </div>
                    <span class="text-sm text-slate-900">{{ account.name || 'Not set' }}</span>
                  </div>

                  <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-white/80 border border-blue-100">
                    <div class="flex items-center gap-2">
                      <Mail class="text-blue-600" :size="18" />
                      <span class="text-sm font-medium text-slate-700">Email:</span>
                    </div>
                    <span class="text-sm text-slate-900">{{ account.email }}</span>
                  </div>

                  <div v-if="account.username" class="flex items-center justify-between px-3 py-2 rounded-lg bg-white/80 border border-blue-100">
                    <div class="flex items-center gap-2">
                      <UserCircle class="text-blue-600" :size="18" />
                      <span class="text-sm font-medium text-slate-700">Username:</span>
                    </div>
                    <span class="text-sm text-slate-900">{{ account.username }}</span>
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
                  <p>Member since: {{ new Date(account.created_at).toLocaleDateString() }}</p>
                </div>
              </div>

              <button
                @click="handleEditProfile"
                class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700"
              >
                <User :size="16" />
                Edit Profile
              </button>

              <button
                @click="handleSignOut"
                class="w-full inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <LogOut :size="16" />
                Sign out
              </button>
            </div>

            <!-- Success/Error Messages -->
            <div v-if="success" class="rounded-lg bg-green-50 border border-green-200 p-3">
              <p class="text-sm text-green-600">{{ success }}</p>
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
