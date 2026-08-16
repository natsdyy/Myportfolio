<script setup>
import { Mail, Phone, Facebook, Instagram } from 'lucide-vue-next'

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'charleslouiealvaran@gmail.com', link: 'mailto:charleslouiealvaran@gmail.com' },
  { icon: Phone, label: 'Phone', value: '+63 929 856 8415', link: 'tel:+639298568415' },
  { icon: Facebook, label: 'Facebook', value: 'facebook.com/CharlesLouieAlvaran', link: 'https://www.facebook.com/CharlesLouieAlvaran/' },
  { icon: Instagram, label: 'Instagram', value: '@natsdyyy', link: 'https://www.instagram.com/natsdyyy/' }
]
</script>

<template>
  <section id="contact" class="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-app transition-colors duration-500 overflow-hidden">
    <!-- Background Accents -->
    <div class="absolute top-1/2 left-0 -translate-y-1/2 w-[60rem] h-[60rem] bg-blue-600/5 blur-[180px] rounded-full pointer-events-none"></div>

    <div class="container-main relative mx-auto max-w-6xl">
      <div class="flex flex-col gap-8 sm:gap-10 lg:gap-12 max-w-4xl">
        <!-- Text Side -->
        <div class="space-y-6">
          <div class="inline-flex items-center gap-3">
            <span class="h-px w-8 bg-blue-600"></span>
            <span class="text-xs font-black uppercase tracking-[0.4em] text-blue-600">Contact</span>
          </div>
          <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-main leading-[1] tracking-tighter">
            Start the <br /><span class="text-blue-600">Dialogue.</span>
          </h2>
          <p class="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
            Ready to bring your vision to life? Reach out and let's discuss how I can contribute to your team.
          </p>
        </div>

        <!-- Contact Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <a 
            v-for="info in contactInfo" 
            :key="info.label"
            :href="info.link"
            target="_blank"
            class="group flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-main bg-card-custom shadow-sm transition-all hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-xl cursor-pointer"
          >
            <div class="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 border border-blue-600/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
              <component :is="info.icon" :size="20" class="sm:hidden" />
              <component :is="info.icon" :size="24" class="hidden sm:block" />
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{{ info.label }}</p>
              <p class="text-xs sm:text-sm font-bold text-main truncate">{{ info.value }}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
