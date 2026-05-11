<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { MessageSquare, X, Send, Loader2, Search, Sparkles, Trash2 } from 'lucide-vue-next'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useResumeModal } from '../../../composables/useResumeModal'

const { openModal } = useResumeModal()

const isOpen = ref(false)
const query = ref('')
const isLoading = ref(false)
const defaultMessage = { role: 'assistant', content: "Hi! I'm Charles' personal AI. You can ask me about his tech stack, his projects, or I can even help you search for live info on the web. How can I help you today?" }
const messages = ref([defaultMessage])
const scrollContainer = ref(null)
const textareaRef = ref(null)

const suggestedPrompts = [
  "What is your tech stack?",
  "Tell me about Rentopia",
  "Are you available for hire?",
  "What is your latest project?"
]

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom()
    nextTick(() => { if (textareaRef.value) textareaRef.value.focus() })
  }
}

const clearChat = () => {
  messages.value = [defaultMessage]
}

const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

const handleInput = (e) => {
  const target = e.target
  target.style.height = 'auto'
  target.style.height = `${Math.min(target.scrollHeight, 120)}px`
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const usePrompt = (prompt) => {
  query.value = prompt
  sendMessage()
}

const renderMarkdown = (text) => {
  const rawHtml = marked.parse(text)
  return DOMPurify.sanitize(rawHtml)
}

const handleMarkdownClick = (e) => {
  const target = e.target.closest('a')
  if (target && target.getAttribute('href') === '#resume') {
    e.preventDefault()
    openModal()
  }
}

const sendMessage = async () => {
  if (!query.value.trim() || isLoading.value) return

  const userQuery = query.value
  messages.value.push({ role: 'user', content: userQuery })
  query.value = ''
  isLoading.value = true
  scrollToBottom()
  
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

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
    nextTick(() => { if (textareaRef.value) textareaRef.value.focus() })
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
          <div class="flex items-center gap-2">
            <button @click="clearChat" title="Clear Chat" class="p-2 hover:bg-main/10 rounded-xl transition-colors text-muted">
              <Trash2 :size="18" />
            </button>
            <button @click="toggleChat" class="p-2 hover:bg-main/10 rounded-xl transition-colors text-muted">
              <X :size="20" />
            </button>
          </div>
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
                'max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed overflow-hidden',
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-main/5 text-main border border-main rounded-tl-none'
              ]"
            >
              <div v-if="msg.role === 'user'" class="whitespace-pre-wrap">{{ msg.content }}</div>
              <div v-else class="markdown-body text-sm leading-relaxed" v-html="renderMarkdown(msg.content)" @click="handleMarkdownClick"></div>
              
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
        <div class="p-4 border-t border-main bg-app flex flex-col gap-3">
          <!-- Suggested Prompts -->
          <div v-if="messages.length === 1" class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button 
              v-for="prompt in suggestedPrompts" 
              :key="prompt"
              @click="usePrompt(prompt)"
              class="whitespace-nowrap px-3 py-1.5 rounded-xl border border-main bg-main/5 text-xs text-main hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
            >
              {{ prompt }}
            </button>
          </div>

          <form @submit.prevent="sendMessage" class="relative flex items-end gap-2 bg-main/5 border border-main rounded-2xl p-2 focus-within:border-blue-600/50 transition-colors">
            <textarea 
              ref="textareaRef"
              v-model="query"
              rows="1"
              placeholder="Ask me anything..."
              @input="handleInput"
              @keydown="handleKeydown"
              class="w-full bg-transparent resize-none py-2 pl-4 text-sm text-main placeholder:text-muted focus:outline-none max-h-32"
            ></textarea>
            <button 
              type="submit"
              :disabled="isLoading || !query.trim()"
              class="h-10 w-10 flex-shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale mb-0.5 mr-0.5"
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

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Markdown Styles */
:deep(.markdown-body) {
  color: var(--text-main);
}
:deep(.markdown-body p) {
  margin-bottom: 0.5rem;
}
:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}
:deep(.markdown-body a) {
  color: var(--color-blue-600, #2563eb);
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.3s ease;
}
:deep(.markdown-body a:hover) {
  color: #1d4ed8;
}
:deep(.markdown-body strong) {
  font-weight: 900;
  color: var(--text-main);
}
:deep(.markdown-body ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
:deep(.markdown-body li) {
  margin-bottom: 0.25rem;
}
</style>
