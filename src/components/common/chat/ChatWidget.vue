<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Square,
  RotateCcw,
  ExternalLink,
  Briefcase,
  Code2,
  Rocket,
  Zap,
  Smile,
  MessageCircle,
  FileText,
  Lightbulb,
  Mail,
  Bot
} from 'lucide-vue-next'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useResumeModal } from '../../../composables/useResumeModal'
import { analyzeConversation } from '../../../utils/chatAnalyzer'

const { openModal } = useResumeModal()

// ── Config ──────────────────────────────────────────────────────
const STORAGE_KEY = 'cla-chat-history-v2'
const MAX_STORED_MESSAGES = 40
const HISTORY_SENT_TO_SERVER = 12

const welcomeMessage = () => ({
  id: 'welcome',
  role: 'assistant',
  content: "Hey there! 👋 I'm **CLA Assistant**, Charles' AI companion & portfolio wingman.\n\nI have a built-in JS conversation engine to talk shop about his **full-stack projects**, breakdown his **tech stack**, share his **resume**, or answer any tech & coding questions. What would you like to explore today? 🚀",
})

// ── State ───────────────────────────────────────────────────────
const isOpen = ref(false)
const query = ref('')
const isLoading = ref(false)
const messages = ref([welcomeMessage()])
const copiedId = ref(null)
const scrollContainer = ref(null)
const textareaRef = ref(null)
let abortController = null
let idCounter = 0

const newId = () => `${Date.now().toString(36)}-${idCounter++}`
const hasConversation = computed(() => messages.value.length > 1)
const streamingMessage = computed(() => messages.value.find(m => m.streaming))
const showTypingDots = computed(() => isLoading.value && !streamingMessage.value?.content)

// ── Real-Time JS Chat Analysis ──────────────────────────────────
const chatAnalysis = computed(() => analyzeConversation(messages.value, query.value))

// Choose which icon to show for the vibe badge
const vibeIconComponent = computed(() => {
  switch (chatAnalysis.value.vibeBadge.icon) {
    case 'Briefcase': return Briefcase
    case 'Code2': return Code2
    case 'Rocket': return Rocket
    case 'Zap': return Zap
    case 'Smile': return Smile
    case 'MessageCircle': return MessageCircle
    default: return Sparkles
  }
})

// Display typing suggestions if user has typed something matching, else dynamic context suggestions
const activeSuggestions = computed(() => {
  if (chatAnalysis.value.typingSuggestions.length > 0) {
    return chatAnalysis.value.typingSuggestions
  }
  return chatAnalysis.value.suggestions
})

// ── Quick Action Shortcuts ──────────────────────────────────────
const quickActions = [
  { label: 'Resume', icon: FileText, action: () => openModal() },
  { label: 'Top Systems', icon: Rocket, action: () => sendMessage('Show me your featured web systems 🚀') },
  { label: 'Tech Stack', icon: Code2, action: () => sendMessage("What is Charles' tech stack? ⚡") },
  { label: 'Contact', icon: Mail, action: () => sendMessage('How can I contact Charles directly? ✉️') },
  { label: 'Dev Joke', icon: Lightbulb, action: () => sendMessage('Tell me a fun programmer joke! 😄') },
]

// ── Persistence ─────────────────────────────────────────────────
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(saved) && saved.length) messages.value = saved
  } catch { /* ignore corrupt storage */ }
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  abortController?.abort()
  window.removeEventListener('keydown', handleGlobalKeydown)
})

watch(messages, (val) => {
  const toStore = val.filter(m => !m.streaming).slice(-MAX_STORED_MESSAGES)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore)) } catch { /* quota */ }
}, { deep: true })

// ── UI helpers ──────────────────────────────────────────────────
function handleGlobalKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) isOpen.value = false
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom(true)
    nextTick(() => textareaRef.value?.focus())
  }
}

const clearChat = () => {
  abortController?.abort()
  messages.value = [welcomeMessage()]
}

const isNearBottom = () => {
  const el = scrollContainer.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

const scrollToBottom = async (force = false) => {
  const shouldScroll = force || isNearBottom()
  await nextTick()
  if (shouldScroll && scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    sendMessage()
  }
}

// ── Markdown ────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true })

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || ''
    if (/^https?:\/\//i.test(href)) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  }
})

const renderMarkdown = (text) => DOMPurify.sanitize(marked.parse(text || ''))

const handleMarkdownClick = (e) => {
  const link = e.target.closest('a')
  if (link && link.getAttribute('href') === '#resume') {
    e.preventDefault()
    openModal()
  }
}

const copyMessage = async (msg) => {
  try {
    await navigator.clipboard.writeText(msg.content)
    copiedId.value = msg.id
    setTimeout(() => { if (copiedId.value === msg.id) copiedId.value = null }, 1500)
  } catch { /* clipboard blocked */ }
}

const sourceHost = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

// ── Networking ──────────────────────────────────────────────────
async function streamReply(userQuery, history, assistantMsg, signal) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ query: userQuery, history, stream: true }),
    signal,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    const data = await response.json()
    assistantMsg.content = data.answer || ''
    assistantMsg.sources = data.sources || []
    assistantMsg.mode = data.mode
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const line = raw.split('\n').find(l => l.startsWith('data:'))
      if (!line) continue

      let event
      try { event = JSON.parse(line.slice(5).trim()) } catch { continue }

      if (event.type === 'delta') {
        assistantMsg.content += event.text
        scrollToBottom()
      } else if (event.type === 'done') {
        assistantMsg.sources = event.sources || []
        assistantMsg.mode = event.mode
      } else if (event.type === 'error') {
        throw new Error(event.message)
      }
    }
  }
}

const sendMessage = async (overrideQuery) => {
  const userQuery = (typeof overrideQuery === 'string' ? overrideQuery : query.value).trim()
  if (!userQuery || isLoading.value) return

  // History BEFORE the new message, without the welcome or failed turns.
  const history = messages.value
    .filter(m => m.id !== 'welcome' && !m.error && m.content)
    .slice(-HISTORY_SENT_TO_SERVER)
    .map(({ role, content }) => ({ role, content }))

  messages.value.push({ id: newId(), role: 'user', content: userQuery })
  messages.value.push({ id: newId(), role: 'assistant', content: '', sources: [], streaming: true })
  
  const assistantMsg = messages.value[messages.value.length - 1]

  query.value = ''
  nextTick(autoResize)
  isLoading.value = true
  scrollToBottom(true)

  abortController = new AbortController()
  try {
    await streamReply(userQuery, history, assistantMsg, abortController.signal)
    if (!assistantMsg.content) throw new Error('Empty response')
  } catch (error) {
    if (error.name === 'AbortError') {
      if (!assistantMsg.content) assistantMsg.content = '_Stopped._'
    } else {
      assistantMsg.error = true
      assistantMsg.retryQuery = userQuery
      assistantMsg.content = assistantMsg.content
        ? `${assistantMsg.content}\n\n_Connection interrupted._`
        : "I'm having trouble connecting right now. Please try again in a moment."
    }
  } finally {
    assistantMsg.streaming = false
    isLoading.value = false
    abortController = null
    scrollToBottom()
    nextTick(() => textareaRef.value?.focus())
  }
}

const stopGenerating = () => abortController?.abort()

const retry = (msg) => {
  const idx = messages.value.findIndex(m => m.id === msg.id)
  if (idx > 0) messages.value.splice(idx - 1, 2)
  sendMessage(msg.retryQuery)
}
</script>

<template>
  <div :class="['fixed z-[100] flex flex-col items-end pointer-events-none', isOpen ? 'inset-0 md:inset-auto md:bottom-6 md:right-6' : 'bottom-6 right-6']">

    <!-- Chat Window -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform scale-95 opacity-0 md:translate-y-6"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 md:translate-y-6"
    >
      <section
        v-if="isOpen"
        id="chat-window"
        role="dialog"
        aria-label="CLA Assistant chat"
        class="pointer-events-auto w-full h-full md:h-[700px] md:max-h-[calc(100vh-100px)] md:w-[440px] md:mb-4 bg-app/95 backdrop-blur-2xl md:border md:border-main/30 rounded-none md:rounded-[1.75rem] shadow-2xl flex flex-col overflow-hidden origin-bottom-right"
      >
        <!-- Header -->
        <header class="px-5 py-3.5 border-b border-main/20 flex flex-col gap-2.5 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-purple-500/5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 relative">
                <Bot :size="20" class="animate-bounce-subtle" />
                <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-app rounded-full"></span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-main tracking-tight">CLA Assistant</h2>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">AI Wingman</span>
                </div>
                <p class="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {{ isLoading ? 'Thinking & Synthesizing…' : 'JS Context Engine Active' }}
                </p>
              </div>
            </div>

            <!-- Header Action Controls -->
            <div class="flex items-center gap-1">
              <button
                v-if="hasConversation"
                id="chat-clear-btn"
                @click="clearChat"
                title="Reset conversation"
                aria-label="Reset conversation"
                class="p-2 hover:bg-main/10 rounded-full transition-colors text-muted hover:text-red-500"
              >
                <Trash2 :size="16" />
              </button>
              <button
                id="chat-close-btn"
                @click="toggleChat"
                title="Close chat"
                aria-label="Close chat"
                class="p-2 hover:bg-main/10 rounded-full transition-colors text-muted hover:text-main"
              >
                <X :size="18" />
              </button>
            </div>
          </div>

          <!-- Live JS Conversation Vibe Pill -->
          <div class="flex items-center justify-between text-[11px] pt-1 border-t border-main/10">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-main/5 border border-main/15 text-main font-medium">
              <component :is="vibeIconComponent" :size="12" class="text-blue-500 animate-pulse" />
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ chatAnalysis.vibeBadge.label }}</span>
              <span class="text-muted text-[10px]">• {{ chatAnalysis.vibeBadge.sublabel }}</span>
            </div>
            <button
              @click="openModal()"
              title="Open Resume Viewer"
              class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <FileText :size="12" />
              <span>Resume</span>
            </button>
          </div>
        </header>

        <!-- Quick Shortcut Bar -->
        <div class="px-4 py-2 bg-main/5 border-b border-main/10 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            v-for="item in quickActions"
            :key="item.label"
            @click="item.action"
            class="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-app/80 border border-main/15 text-main hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-150 active:scale-95"
          >
            <component :is="item.icon" :size="11" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- Messages Container -->
        <div ref="scrollContainer" id="chat-messages" class="chat-scroll flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-live="polite">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['group flex flex-col msg-enter', msg.role === 'user' ? 'items-end' : 'items-start']"
          >
            <!-- User bubble -->
            <div
              v-if="msg.role === 'user'"
              class="max-w-[85%] px-4 py-2.5 text-[13.5px] leading-relaxed bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl rounded-br-sm shadow-md shadow-blue-600/20 whitespace-pre-wrap break-words"
            >{{ msg.content }}</div>

            <!-- Assistant bubble -->
            <template v-else-if="msg.content || !msg.streaming">
              <div
                :class="[
                  'max-w-[94%] px-4 py-3 text-[13.5px] leading-relaxed rounded-2xl rounded-bl-sm shadow-sm border transition-all',
                  msg.error
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-main'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/60 text-main'
                ]"
              >
                <!-- Assistant Sub-badge -->
                <div class="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-main/10 text-[10px] font-semibold text-muted">
                  <Sparkles :size="11" class="text-blue-500" />
                  <span>CLA Assistant</span>
                  <span v-if="msg.mode === 'ai'" class="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-500">Gemini LLM</span>
                  <span v-else-if="msg.mode === 'search'" class="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-500">Live Web</span>
                  <span v-else-if="msg.mode === 'local'" class="text-[9px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-500">Local Engine</span>
                </div>

                <div
                  :class="['markdown-body break-words', msg.streaming && 'is-streaming']"
                  v-html="renderMarkdown(msg.content)"
                  @click="handleMarkdownClick"
                ></div>

                <!-- One-click Resume Modal Callout if resume is referenced -->
                <div
                  v-if="msg.content && msg.content.includes('#resume') && !msg.streaming"
                  class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50"
                >
                  <button
                    @click="openModal()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <FileText :size="13" />
                    <span>Open Interactive Resume Viewer</span>
                  </button>
                </div>

                <!-- Sources tag -->
                <div v-if="msg.sources?.length && !msg.streaming" class="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap gap-1.5">
                  <template v-for="source in msg.sources" :key="source.url || source.label">
                    <a
                      v-if="source.url"
                      :href="source.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      :title="source.label"
                      class="inline-flex items-center gap-1 max-w-[180px] text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/25 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded-md transition-colors"
                    >
                      <ExternalLink :size="10" class="flex-shrink-0" />
                      <span class="truncate">{{ sourceHost(source.url) || source.label }}</span>
                    </a>
                    <span v-else class="text-[9px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                      {{ source.label }}
                    </span>
                  </template>
                </div>
              </div>

              <!-- Action buttons for message -->
              <div v-if="msg.id !== 'welcome' && !msg.streaming" class="flex items-center gap-1 mt-1 ml-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  @click="copyMessage(msg)"
                  :title="copiedId === msg.id ? 'Copied!' : 'Copy'"
                  aria-label="Copy message"
                  class="p-1.5 rounded-md text-muted hover:text-main hover:bg-main/10 transition-colors"
                >
                  <Check v-if="copiedId === msg.id" :size="13" class="text-emerald-500" />
                  <Copy v-else :size="13" />
                </button>
                <button
                  v-if="msg.error && msg.retryQuery"
                  @click="retry(msg)"
                  title="Retry"
                  aria-label="Retry"
                  class="p-1.5 rounded-md text-muted hover:text-main hover:bg-main/10 transition-colors"
                >
                  <RotateCcw :size="13" />
                </button>
              </div>
            </template>
          </div>

          <!-- Typing indicator dots -->
          <div v-if="showTypingDots" class="flex items-start msg-enter">
            <div class="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
              <span class="typing-dot"></span>
              <span class="typing-dot" style="animation-delay: 0.15s"></span>
              <span class="typing-dot" style="animation-delay: 0.3s"></span>
              <span class="text-[11px] font-medium text-muted ml-2">Synthesizing reply…</span>
            </div>
          </div>
        </div>

        <!-- Dynamic Context Suggestions & Input Container -->
        <div class="p-3.5 border-t border-main/10 bg-app/90 backdrop-blur-lg flex flex-col gap-2.5">
          <!-- Dynamic suggestions powered by JS Chat Analyzer -->
          <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            <span class="text-[10px] font-bold text-muted uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
              <Sparkles :size="10" class="text-blue-500" />
              Ask:
            </span>
            <button
              v-for="(suggestion, i) in activeSuggestions"
              :key="`suggest-${i}-${suggestion}`"
              :id="`chat-suggestion-${i}`"
              @click="sendMessage(suggestion)"
              class="whitespace-nowrap flex-shrink-0 px-3 py-1 rounded-full border border-main/20 bg-main/5 text-[11px] font-medium text-main hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 transition-all duration-200"
            >
              {{ suggestion }}
            </button>
          </div>

          <!-- Input Bar -->
          <form
            @submit.prevent="sendMessage()"
            class="relative flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-[1.5rem] p-1.5 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all shadow-sm"
          >
            <label for="chat-input" class="sr-only">Message</label>
            <textarea
              id="chat-input"
              ref="textareaRef"
              v-model="query"
              rows="1"
              maxlength="1000"
              placeholder="Ask anything about Charles' projects, stack, or tech…"
              @input="autoResize"
              @keydown="handleKeydown"
              class="w-full bg-transparent resize-none py-2 pl-3.5 text-sm text-main placeholder:text-muted focus:outline-none max-h-32"
            ></textarea>
            
            <button
              v-if="isLoading"
              id="chat-stop-btn"
              type="button"
              @click="stopGenerating"
              title="Stop generating"
              aria-label="Stop generating"
              class="h-9 w-9 flex-shrink-0 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center hover:scale-105 transition-transform mb-0.5 mr-0.5"
            >
              <Square :size="12" fill="currentColor" />
            </button>
            <button
              v-else
              id="chat-send-btn"
              type="submit"
              :disabled="!query.trim()"
              aria-label="Send message"
              class="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-40 disabled:shadow-none mb-0.5 mr-0.5"
            >
              <Send :size="16" class="ml-0.5" />
            </button>
          </form>

          <div class="flex items-center justify-between text-[10px] text-muted px-1 -mt-1">
            <span>Powered by Gemini & JS Chat Analyzer</span>
            <span>Shift+Enter for newline</span>
          </div>
        </div>
      </section>
    </Transition>

    <!-- Floating Launcher Button -->
    <button
      id="chat-launcher"
      @click="toggleChat"
      :aria-label="isOpen ? 'Close chat' : 'Open chat'"
      :class="[
        'h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group pointer-events-auto relative',
        isOpen ? 'hidden md:flex bg-slate-100 dark:bg-slate-800 text-muted hover:text-main border border-main/20' : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/40'
      ]"
    >
      <MessageSquare v-if="!isOpen" :size="24" class="group-hover:rotate-12 transition-transform" />
      <X v-else :size="24" />
      <span v-if="!isOpen && !hasConversation" class="absolute -top-0.5 -right-0.5 h-4 w-4 bg-emerald-500 border-2 border-app rounded-full animate-pulse"></span>
    </button>
  </div>
</template>

<style scoped>
.chat-scroll::-webkit-scrollbar { width: 5px; }
.chat-scroll::-webkit-scrollbar-track { background: transparent; }
.chat-scroll::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 10px; }
.chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.msg-enter { animation: msg-in 0.25s ease-out; }
@keyframes msg-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.typing-dot {
  width: 6px; height: 6px; border-radius: 9999px;
  background: #3b82f6;
  animation: typing 1s infinite ease-in-out;
}
@keyframes typing {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

/* Blinking caret while streaming */
:deep(.markdown-body.is-streaming > :last-child::after) {
  content: '';
  display: inline-block;
  width: 7px; height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: #3b82f6;
  border-radius: 1px;
  animation: caret 0.9s steps(1) infinite;
}
@keyframes caret { 50% { opacity: 0; } }

/* Markdown */
:deep(.markdown-body) { color: var(--text-main); }
:deep(.markdown-body p) { margin-bottom: 0.6rem; }
:deep(.markdown-body > :last-child) { margin-bottom: 0; }
:deep(.markdown-body a) {
  color: #3b82f6; font-weight: 600; text-decoration: none;
  border-bottom: 1px solid transparent; transition: all 0.2s ease;
}
:deep(.markdown-body a:hover) { color: #2563eb; border-bottom-color: #2563eb; }
:deep(.markdown-body strong) { font-weight: 700; color: var(--text-main); }
:deep(.markdown-body ul) { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.6rem; }
:deep(.markdown-body ol) { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.6rem; }
:deep(.markdown-body li) { margin-bottom: 0.25rem; }
:deep(.markdown-body h1), :deep(.markdown-body h2), :deep(.markdown-body h3) {
  font-size: 1.05em; font-weight: 700; margin: 0.9rem 0 0.4rem;
}
:deep(.markdown-body blockquote) {
  border-left: 3px solid rgba(59, 130, 246, 0.5);
  padding-left: 0.75rem; margin: 0.5rem 0; opacity: 0.85;
}
:deep(.markdown-body code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em; padding: 0.1rem 0.35rem; border-radius: 0.3rem;
  background: rgba(100, 116, 139, 0.15);
}
:deep(.markdown-body pre) {
  margin: 0.6rem 0; padding: 0.75rem 0.9rem; border-radius: 0.6rem;
  background: #0f172a; color: #e2e8f0; overflow-x: auto; font-size: 12px; line-height: 1.55;
}
:deep(.markdown-body pre code) { background: none; padding: 0; font-size: inherit; color: inherit; }
:deep(.markdown-body table) { width: 100%; border-collapse: collapse; margin: 0.6rem 0; font-size: 12px; }
:deep(.markdown-body th), :deep(.markdown-body td) { border: 1px solid rgba(100, 116, 139, 0.25); padding: 0.35rem 0.5rem; text-align: left; }
:deep(.markdown-body hr) { border: none; border-top: 1px solid rgba(100, 116, 139, 0.25); margin: 0.8rem 0; }
</style>
