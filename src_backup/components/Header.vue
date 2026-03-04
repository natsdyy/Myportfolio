<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Menu, X, Code, LogIn, User, LogOut, ChevronDown } from 'lucide-vue-next'
import { useGoogleAuth } from '../composables/useGoogleAuth'

defineProps({
  currentPage: String
})

const emit = defineEmits(['navigate'])
const menuOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref(null)
const mobileUserMenuRef = ref(null)

const { user, isAuthenticated, signOut } = useGoogleAuth()

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const clickedInsideDesktop = userMenuRef.value?.contains(event.target)
  const clickedInsideMobile = mobileUserMenuRef.value?.contains(event.target)
  
  if (!clickedInsideDesktop && !clickedInsideMobile) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const navItems = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Projects', id: 'projects' },
  { name: 'Skills', id: 'skills' },
  { name: 'Contact', id: 'contact' }
]

const handleNavigate = (page) => {
  emit('navigate', page)
  menuOpen.value = false
  userMenuOpen.value = false
}

const handleSignOut = () => {
  signOut()
  userMenuOpen.value = false
  emit('navigate', 'home')
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-blue-100/80 bg-white/80 backdrop-blur-xl shadow-[0_18px_45px_-35px_rgba(37,99,235,0.6)]"
  >
    <div class="container-main">
      <div class="flex items-center justify-between py-5">
        <button
          @click="handleNavigate('home')"
          class="group flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span
            class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-lg text-white"
          >
            <Code :size="28" />
          </span>
          <span class="hidden text-xl font-bold tracking-tight text-slate-900 sm:block">
            <span class="text-blue-500">CLA</span><span class="text-blue-600">.dev</span>
          </span>
        </button>

        <div class="hidden md:flex items-center gap-4">
          <nav class="flex items-center gap-1 rounded-full border border-blue-100 bg-white/70 p-1 shadow-inner">
            <button
              v-for="item in navItems"
              :key="item.id"
              @click="handleNavigate(item.id)"
              :class="[
                'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300',
                currentPage === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/80'
              ]"
            >
              {{ item.name }}
            </button>
          </nav>

          <!-- Auth Section -->
          <div class="relative">
            <!-- Not Authenticated: Login Button -->
            <button
              v-if="!isAuthenticated"
              @click="handleNavigate('login')"
              class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <LogIn :size="18" />
              Login
            </button>

            <!-- Authenticated: User Menu -->
            <div v-else class="relative" ref="userMenuRef">
              <button
                @click.stop="userMenuOpen = !userMenuOpen"
                class="flex items-center gap-3 rounded-full border border-blue-100 bg-white/90 px-3 py-2 shadow-md transition-all duration-200 hover:shadow-lg hover:border-blue-200"
              >
                <img
                  v-if="user?.picture"
                  :src="user.picture"
                  :alt="user.name"
                  class="h-9 w-9 rounded-full border-2 border-blue-100 object-cover"
                />
                <div class="hidden lg:block text-left">
                  <p class="text-xs font-semibold text-slate-900 leading-tight">{{ user?.name }}</p>
                  <p class="text-xs text-slate-500 leading-tight truncate max-w-[120px]">{{ user?.email }}</p>
                </div>
                <ChevronDown :size="16" class="text-slate-500" :class="{ 'rotate-180': userMenuOpen }" />
              </button>

              <!-- User Dropdown Menu -->
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-56 rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div class="p-4 border-b border-blue-50">
                    <p class="text-sm font-semibold text-slate-900">{{ user?.name }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ user?.email }}</p>
                  </div>
                  <div class="p-2">
                    <button
                      @click="handleNavigate('login')"
                      class="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50"
                    >
                      <User :size="18" class="text-blue-600" />
                      View Profile
                    </button>
                    <button
                      @click="handleSignOut"
                      class="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut :size="18" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden flex items-center gap-3">
          <!-- Mobile Auth Button -->
          <button
            v-if="!isAuthenticated"
            @click="handleNavigate('login')"
            class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg"
          >
            <LogIn :size="16" />
            Login
          </button>
          <div v-else class="relative" ref="mobileUserMenuRef">
            <button
              @click.stop="userMenuOpen = !userMenuOpen"
              class="inline-flex items-center justify-center rounded-full border border-blue-100 bg-white/90 p-2 shadow-md"
            >
              <img
                v-if="user?.picture"
                :src="user.picture"
                :alt="user.name"
                class="h-8 w-8 rounded-full border border-blue-100 object-cover"
              />
              <User v-else :size="20" class="text-blue-600" />
            </button>
            
            <!-- Mobile User Dropdown -->
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-48 rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
              >
                <div class="p-3 border-b border-blue-50">
                  <p class="text-xs font-semibold text-slate-900 truncate">{{ user?.name }}</p>
                  <p class="text-xs text-slate-500 truncate">{{ user?.email }}</p>
                </div>
                <div class="p-2">
                  <button
                    @click="handleNavigate('login')"
                    class="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-blue-50"
                  >
                    <User :size="16" class="text-blue-600" />
                    Profile
                  </button>
                  <button
                    @click="handleSignOut"
                    class="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut :size="16" />
                    Sign Out
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <button
            @click="menuOpen = !menuOpen"
            class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-blue-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Menu v-if="!menuOpen" :size="22" />
            <X v-else :size="22" />
          </button>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <div
        v-if="menuOpen"
        class="md:hidden border-t border-blue-100 bg-white/95 px-4 pb-6 shadow-lg backdrop-blur"
      >
        <div class="container-main flex flex-col gap-2 pt-4">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="handleNavigate(item.id)"
            :class="[
              'w-full rounded-2xl px-5 py-3 text-left text-base font-semibold transition-all duration-200',
              currentPage === item.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-600'
            ]"
          >
            {{ item.name }}
          </button>
        </div>
      </div>
    </transition>
  </header>
</template>
