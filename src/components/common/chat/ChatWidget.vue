<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { MessageSquare, X, Send, Loader2, Search, Sparkles } from 'lucide-vue-next'
import axios from 'axios'

const isOpen = ref(false)
const query = ref('')
const isLoading = ref(false)
const messages = ref([
  { role: 'assistant', content: "Hi! I'm Charles' personal AI. You can ask me about his tech stack, his projects, or I can even help you search for live info on the web. How can I help you today?" }
])
const scrollContainer = ref(null)

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!query.value.trim() || isLoading.value) return

  const userQuery = query.value
  messages.value.push({ role: 'user', content: userQuery })
  query.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const response = await axios.post('/api/ai/chat', {
      query: userQuery,
      history: messages.value.slice(-5) // Send last 5 messages for context
    })

    messages.value.push({ 
      role: 'assistant', 
      content: response.data.answer,
      searched: response.data.searched,
      sources: response.data.sources,
      mode: response.data.mode
    })
  } catch (error) {
    messages.value.push({ 
      role: 'assistant', 
      content: "I'm having a bit of trouble processing that right now. Could you try rephrasing your question?" 
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <div :class="['fixed z-[100] transition-all duration-500', isOpen ? 'inset-0 md:inset-auto md:bottom-8 md:right-8' : 'bottom-8 right-8']" class="flex flex-col items-end pointer-events-none">
    <!-- Chat Window -->
    <div class="pointer-events-auto h-full w-full flex flex-col items-end justify-end">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-y-10"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 translate-y-10"
    >
      <div v-if="isOpen" class="w-full h-full md:h-[750px] md:w-[550px] md:mb-6 bg-app border-none md:border md:border-main rounded-none md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="p-6 border-b border-main flex items-center justify-between bg-blue-600/5">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Sparkles :size="20" />
            </div>
            <div>
              <p class="text-sm font-black text-main">AI Assistant</p>
              <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Always Learning</p>
            </div>
          </div>
          <button @click="toggleChat" class="p-2 hover:bg-main/10 rounded-xl transition-colors text-muted">
            <X :size="20" />
          </button>
        </div>

        <!-- Messages -->
        <div ref="scrollContainer" class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <div 
            v-for="(msg, idx) in messages" 
            :key="idx"
            :class="['flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start']"
          >
            <div 
              :class="[
                'max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-main/5 text-main border border-main rounded-tl-none'
              ]"
            >
              <div class="message-content">{{ msg.content }}</div>
              
              <!-- Source Tags -->
              <div v-if="msg.sources && msg.sources.length" class="mt-3 pt-3 border-t border-main/10 flex flex-wrap gap-2">
                <span v-for="source in msg.sources" :key="source" class="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 bg-blue-600/5 px-2 py-1 rounded-md">
                  {{ source }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="isLoading" class="flex items-start">
            <div class="bg-main/5 border border-main p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
              <Loader2 class="animate-spin text-blue-600" :size="16" />
              <span class="text-xs text-muted font-bold tracking-widest uppercase italic">Thinking...</span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="p-6 border-t border-main bg-app">
          <form @submit.prevent="sendMessage" class="relative">
            <input 
              v-model="query"
              type="text"
              placeholder="Ask me anything..."
              class="w-full bg-main/5 border border-main rounded-2xl py-4 pl-6 pr-14 text-sm text-main placeholder:text-muted focus:outline-none focus:border-blue-600/50 transition-colors"
            />
            <button 
              type="submit"
              :disabled="isLoading || !query.trim()"
              class="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send :size="18" />
            </button>
          </form>
        </div>
      </div>
    </Transition>
    </div>

    <!-- Trigger Button -->
    <button 
      @click="toggleChat"
      :class="[
        'h-16 w-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group pointer-events-auto',
        isOpen ? 'hidden md:flex md:static bg-main text-app rotate-90 z-[110]' : 'bg-blue-600 text-white'
      ]"
    >
      <MessageSquare v-if="!isOpen" :size="28" class="group-hover:rotate-12 transition-transform" />
      <X v-else :size="28" />
      
      <!-- Notification Dot -->
      <span v-if="!isOpen" class="absolute top-0 right-0 h-4 w-4 bg-red-500 border-2 border-app rounded-full animate-pulse"></span>
    </button>
  </div>
</template>

<style scoped>
/* Custom scrollbar for chat */
div::-webkit-scrollbar {
  width: 4px;
}
div::-webkit-scrollbar-track {
  background: transparent;
}
div::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.2);
  border-radius: 10px;
}
div::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.4);
}
</style>
