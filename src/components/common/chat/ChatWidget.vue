<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { MessageSquare, X, Send, Loader2, Search, Sparkles, Trash2 } from 'lucide-vue-next'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useResumeModal } from '../../../composables/useResumeModal'

const { openModal } = useResumeModal()

const isOpen = ref(false)
const query = ref('')
const isLoading = ref(false)
const loadingMessage = ref('Thinking...')
const defaultMessage = { role: 'assistant', content: "Hi! I'm Charles' personal AI. You can ask me about his tech stack, his projects, or I can even help you search for live info on the web. How can I help you today?" }
const messages = ref([defaultMessage])
const scrollContainer = ref(null)
const textareaRef = ref(null)

const loadingMessages = [
  'Searching the web...',
  'Analyzing sources...',
  'Reading content...',
  'Synthesizing answer...',
  'Finalizing response...'
]

let loadingInterval = null

function startLoading() {
  isLoading.value = true
  let index = 0
  loadingMessage.value = loadingMessages[0]
  loadingInterval = setInterval(() => {
    index = (index + 1) % loadingMessages.length
    loadingMessage.value = loadingMessages[index]
  }, 1500)
}

function stopLoading() {
  isLoading.value = false
  if (loadingInterval) {
    clearInterval(loadingInterval)
    loadingInterval = null
  }
}

onUnmounted(() => {
  stopLoading()
})

const suggestedPrompts = [
  "What is your tech stack?",
  "Tell me about Countryside Steakhouse",
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
  // Capture history BEFORE adding the current message so the server does not
  // treat the current query as a prior turn (fixes follow-up resolution).
  const history = messages.value.slice(-10)
  messages.value.push({ role: 'user', content: userQuery })
  query.value = ''

  // Mood-aware loading messages (Rule 2, 10)
  const frustrationWords = /\b(frustrated|angry|annoyed|ugh|broken|wrong|bad|stupid|nakakainis|bobo|mali)\b/i
  const confusedWords = /\b(confused|don't understand|help|lost|unclear|naguguluhan|di ko gets)\b/i

  if (frustrationWords.test(userQuery)) {
    loadingMessage.value = 'Let me help with that...'
  } else if (confusedWords.test(userQuery)) {
    loadingMessage.value = 'Breaking it down for you...'
  }

  startLoading()
  scrollToBottom()
  
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  try {
    const response = await axios.post('/api/ai/chat', {
      query: userQuery,
      history
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
    stopLoading()
    scrollToBottom()
    nextTick(() => { if (textareaRef.value) textareaRef.value.focus() })
  }
}
</script>

<template>
  <div :class="['fixed z-[100] flex flex-col items-end pointer-events-none', isOpen ? 'inset-0 md:inset-auto md:bottom-6 md:right-6' : 'bottom-6 right-6']">
    
    <!-- Chat Window -->
    <Transition
      enter-active-class="transition duration-400 ease-out"
      enter-from-class="transform scale-95 opacity-0 md:translate-y-8"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 md:translate-y-8"
    >
      <div v-if="isOpen" class="pointer-events-auto w-full h-full md:h-[700px] md:max-h-[calc(100vh-120px)] md:w-[420px] md:mb-4 bg-app/95 backdrop-blur-2xl border-none md:border md:border-main rounded-none md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="px-5 py-4 border-b border-main/20 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 relative">
              <Sparkles :size="18" class="animate-pulse" />
              <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-app rounded-full"></div>
            </div>
            <div>
              <p class="text-sm font-bold text-main tracking-tight">AI Assistant</p>
              <p class="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Always Learning</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button @click="clearChat" title="Clear Chat" class="p-2 hover:bg-main/10 rounded-full transition-colors text-muted hover:text-red-500">
              <Trash2 :size="18" />
            </button>
            <button @click="toggleChat" class="md:hidden p-2 hover:bg-main/10 rounded-full transition-colors text-muted hover:text-main">
              <X :size="20" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="scrollContainer" class="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth">
          <div 
            v-for="(msg, idx) in messages" 
            :key="idx"
            :class="['flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start']"
          >
            <div 
              :class="[
                'max-w-[88%] p-3.5 text-[13.5px] leading-relaxed shadow-sm',
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm shadow-blue-600/20' 
                  : 'bg-white dark:bg-slate-800 text-main border border-slate-100 dark:border-slate-700/60 rounded-2xl rounded-tl-sm'
              ]"
            >
              <div v-if="msg.role === 'user'" class="whitespace-pre-wrap">{{ msg.content }}</div>
              <div v-else class="markdown-body text-[13.5px] leading-relaxed" v-html="renderMarkdown(msg.content)" @click="handleMarkdownClick"></div>
              
              <!-- Source Tags -->
              <div v-if="msg.sources && msg.sources.length" class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap gap-1.5">
                <span v-for="source in msg.sources" :key="source" class="text-[9px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                  {{ source }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex items-start">
            <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
              <div class="flex space-x-1.5">
                <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
              <span class="text-[10px] text-muted font-semibold tracking-wider uppercase">{{ loadingMessage }}</span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-main/10 bg-app/80 backdrop-blur-lg flex flex-col gap-3">
          <!-- Suggested Prompts -->
          <div v-if="messages.length === 1" class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button 
              v-for="prompt in suggestedPrompts" 
              :key="prompt"
              @click="usePrompt(prompt)"
              class="whitespace-nowrap px-3 py-1.5 rounded-full border border-main/20 bg-main/5 text-[11px] font-medium text-main hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300"
            >
              {{ prompt }}
            </button>
          </div>

          <form @submit.prevent="sendMessage" class="relative flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-[1.5rem] p-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-sm">
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
              class="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:shadow-none mb-0.5 mr-0.5"
            >
              <Send :size="16" class="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Trigger Button -->
    <button 
      @click="toggleChat"
      :class="[
        'h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group pointer-events-auto relative',
        isOpen ? 'hidden md:flex bg-slate-100 dark:bg-slate-800 text-muted hover:text-main border border-main/20 rotate-90' : 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-blue-500/30'
      ]"
    >
      <MessageSquare v-if="!isOpen" :size="24" class="group-hover:rotate-12 transition-transform" />
      <X v-else :size="24" />
      
      <!-- Notification Dot -->
      <span v-if="!isOpen" class="absolute top-0 right-0 h-3.5 w-3.5 bg-red-500 border-2 border-app rounded-full animate-pulse"></span>
    </button>
  </div>
</template>

<style scoped>
/* Custom scrollbar for chat */
div::-webkit-scrollbar {
  width: 5px;
}
div::-webkit-scrollbar-track {
  background: transparent;
}
div::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 10px;
}
div::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
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
  margin-bottom: 0.6rem;
}
:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}
:deep(.markdown-body a) {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}
:deep(.markdown-body a:hover) {
  color: #2563eb;
  border-bottom-color: #2563eb;
}
:deep(.markdown-body strong) {
  font-weight: 800;
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
:deep(.markdown-body h3) {
  font-size: 1.1em;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
</style>
