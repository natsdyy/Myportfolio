<script setup>
import { computed } from 'vue'
import { Sparkles, FolderKanban, Mail, ShieldCheck } from 'lucide-vue-next'
import cat3Image from '../../assets/cat3.jpg'

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

const firstName = computed(() => {
  if (!props.user?.name) return null
  return props.user.name.split(' ')[0]
})
</script>

<template>
  <section class="relative overflow-hidden bg-app text-main transition-colors duration-500">
    <!-- Glow background -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-blue-500/10 dark:bg-blue-500/30 blur-3xl" />
      <div class="absolute bottom-[-20%] left-[-5%] h-[380px] w-[380px] rounded-full bg-purple-500/10 dark:bg-purple-500/25 blur-3xl" />
    </div>

    <div class="relative px-4 pt-24 pb-16">
      <div class="container-main">
        <div
          class="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_minmax(0,1fr)] items-center"
        >
          <!-- Left: Welcome copy -->
          <div class="space-y-8">
            <div class="inline-flex items-center gap-2 rounded-full border border-main bg-card-custom px-3 py-1 text-xs font-semibold tracking-[0.3em] uppercase text-muted shadow-sm">
              <span class="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.3)]" />
              <span>Signed in</span>
            </div>

            <div class="space-y-3">
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-main">
                Welcome back
                <span v-if="firstName" class="text-blue-600"> {{ firstName }}</span>
                <span v-else class="text-blue-600"> creator</span>
                <span class="text-blue-600">.</span>
              </h1>
              <p class="text-sm sm:text-base text-muted max-w-xl">
                You’re now logged in as
                <span class="font-semibold text-main">{{ user?.email || 'a regular user' }}</span>.
                Explore projects, manage your profile, or reach out for collaborations—all from this hub.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="rounded-2xl border border-main bg-card-custom p-4 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
                    <FolderKanban :size="18" />
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.22em] text-muted">
                      Projects
                    </p>
                    <p class="text-sm font-semibold text-main">
                      Browse portfolio work
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-main bg-card-custom p-4 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                    <Mail :size="18" />
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.22em] text-muted">
                      Contact
                    </p>
                    <p class="text-sm font-semibold text-main">
                      Send a quick message
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-main bg-card-custom p-4 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600">
                    <ShieldCheck :size="18" />
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.22em] text-muted">
                      Account
                    </p>
                    <p class="text-sm font-semibold text-main">
                      Manage your profile
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p class="flex items-center gap-2 text-xs text-muted">
              <Sparkles :size="14" class="text-blue-600" />
              Tip: use the navigation above to jump to Projects, Contact, or your Profile at any time.
            </p>
          </div>

          <!-- Right: Hero image with cat3 -->
          <div class="flex justify-center lg:justify-end">
            <div class="relative w-full max-w-xl">
              <div
                class="relative overflow-hidden rounded-3xl border border-main bg-card-custom shadow-xl"
              >
                <img
                  :src="cat3Image"
                  alt="Cozy developer cat at a creative login dashboard"
                  class="h-full w-full object-cover"
                />
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                <div class="absolute left-0 right-0 bottom-0 px-6 pb-5 pt-6 flex flex-col gap-2">
                  <p class="text-xs uppercase tracking-[0.24em] text-blue-300">
                    Logged in
                  </p>
                  <p class="text-sm text-white">
                    Welcome to your creative hub. Grab a coffee and start exploring.
                  </p>
                </div>
              </div>
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


