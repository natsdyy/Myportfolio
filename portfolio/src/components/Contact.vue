<script setup>
import { ref } from 'vue'
import { Mail, Phone, MapPin, Send, Facebook, Instagram } from 'lucide-vue-next'

const form = ref({
  name: '',
  email: '',
  message: ''
})

const submitted = ref(false)

const handleSubmit = (e) => {
  e.preventDefault()
  submitted.value = true
  console.log('Form submitted:', form.value)
  
  setTimeout(() => {
    form.value = { name: '', email: '', message: '' }
    submitted.value = false
  }, 2000)
}

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
            <p class="text-sm text-slate-500">I aim to respond within 1-2 business days.</p>
          </div>

          <label class="space-y-2 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            Your Name
              <input 
                v-model="form.name"
                type="text"
                placeholder="Enter your name"
              class="w-full rounded-2xl border border-blue-100 bg-white/80 px-5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
          </label>

          <label class="space-y-2 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            Email Address
              <input 
                v-model="form.email"
                type="email"
              placeholder="you@example.com"
              class="w-full rounded-2xl border border-blue-100 bg-white/80 px-5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
          </label>

          <label class="space-y-2 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            Message
              <textarea 
                v-model="form.message"
              rows="5"
                placeholder="Tell me about your project..."
              class="w-full resize-none rounded-2xl border border-blue-100 bg-white/80 px-5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              ></textarea>
          </label>

          <button
            type="submit"
            class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition duration-300 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5"
          >
            <Send :size="18" />
              {{ submitted ? 'Message Sent! ✓' : 'Send Message' }}
            </button>
        </form>
      </div>
    </div>
  </section>
</template>
