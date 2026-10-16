<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Copy,
  Check,
  Square,
  RotateCcw,
  ExternalLink,
  Code2,
  Rocket,
  FileText,
  Mail,
  Bot
} from 'lucide-vue-next'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useResumeModal } from '../../../composables/useResumeModal'
import { analyzeConversation } from '../../../utils/chatAnalyzer'
import { createSseParser } from '../../../utils/sseParser'

const { openModal } = useResumeModal()

// ── Config ──────────────────────────────────────────────────────
const STORAGE_KEY = 'cla-chat-history-v2'
const MAX_STORED_MESSAGES = 40
const HISTORY_SENT_TO_SERVER = 12

const welcomeMessage = () => ({
  id: 'welcome',
  role: 'assistant',
  content: "Hi, I'm **CLA Assistant**. Ask me about Charles' projects, skills, experience, availability, or resume.\n\nWhat would you like to know?",
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
  { label: 'Projects', icon: Rocket, action: () => sendMessage('Show me Charles\' featured web systems') },
  { label: 'Tech stack', icon: Code2, action: () => sendMessage("What is Charles' tech stack?") },
  { label: 'Contact', icon: Mail, action: () => sendMessage('How can I contact Charles directly?') },
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
  let receivedDone = false
  const parser = createSseParser((event) => {
    if (event.type === 'delta') {
      assistantMsg.content += event.text || ''
      scrollToBottom()
    } else if (event.type === 'done') {
      assistantMsg.sources = Array.isArray(event.sources) ? event.sources : []
      assistantMsg.mode = event.mode
      receivedDone = true
    } else if (event.type === 'error') {
      throw new Error(event.message || 'The assistant could not complete the response.')
    }
  })

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    parser.push(decoder.decode(value, { stream: true }))
  }
  parser.push(decoder.decode())
  parser.finish()

  if (!receivedDone) throw new Error('The connection ended before the response completed.')
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

const suggestionLabel = (suggestion) => suggestion
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

const sendSuggestion = (suggestion) => sendMessage(suggestionLabel(suggestion))

const retry = (msg) => {
  const idx = messages.value.findIndex(m => m.id === msg.id)
  if (idx > 0) messages.value.splice(idx - 1, 2)
  sendMessage(msg.retryQuery)
}
</script>

<template>
  <div :class="['fixed z-[100] flex flex-col items-end pointer-events-none', isOpen ? 'inset-0 md:inset-auto md:bottom-5 md:right-5' : 'bottom-5 right-4 sm:right-5']">

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
        aria-modal="true"
        aria-labelledby="chat-title"
        class="chat-shell pointer-events-auto w-full h-full md:h-[min(760px,calc(100vh-88px))] md:w-[460px] md:mb-3 bg-app/95 backdrop-blur-2xl md:border md:border-main/25 rounded-none md:rounded-[1.75rem] shadow-2xl flex flex-col overflow-hidden origin-bottom-right"
      >
        <!-- Header -->
        <header class="chat-header flex items-center justify-between gap-3 px-4 py-3.5 border-b border-main/15">
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative h-11 w-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Bot :size="21" />
              <span class="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-[3px] border-app"></span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 id="chat-title" class="text-[15px] font-bold text-main tracking-tight">CLA Assistant</h2>
                <span class="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">AI</span>
              </div>
              <div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted min-w-0">
                <span :class="['h-1.5 w-1.5 flex-shrink-0 rounded-full', isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500']"></span>
                <span class="truncate">{{ isLoading ? 'Thinking…' : chatAnalysis.vibeBadge.sublabel }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-0.5">
            <button
              @click="openModal()"
              title="Open resume"
              aria-label="Open resume"
              class="chat-icon-btn"
            >
              <FileText :size="17" />
            </button>
            <button
              v-if="hasConversation"
              id="chat-clear-btn"
              @click="clearChat"
              title="Start a new conversation"
              aria-label="Start a new conversation"
              class="chat-icon-btn"
            >
              <RotateCcw :size="16" />
            </button>
            <button
              id="chat-close-btn"
              @click="toggleChat"
              title="Close chat"
              aria-label="Close chat"
              class="chat-icon-btn"
            >
              <X :size="19" />
            </button>
          </div>
        </header>

        <!-- Messages Container -->
        <div ref="scrollContainer" id="chat-messages" role="log" class="chat-scroll chat-canvas flex-1 overflow-y-auto px-3.5 sm:px-5 py-5 space-y-5" aria-live="polite" aria-relevant="additions text">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['group flex flex-col msg-enter', msg.role === 'user' ? 'items-end' : 'items-start']"
          >
            <!-- User bubble -->
            <div
              v-if="msg.role === 'user'"
              class="max-w-[86%] px-4 py-2.5 text-[13.5px] leading-relaxed bg-blue-600 text-white rounded-[1.25rem] rounded-br-md shadow-sm shadow-blue-600/15 whitespace-pre-wrap break-words"
            >{{ msg.content }}</div>

            <!-- Assistant bubble -->
            <template v-else-if="msg.content || !msg.streaming">
              <div class="flex items-start gap-2.5 w-full">
                <div class="mt-5 h-7 w-7 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles :size="13" />
                </div>

                <div class="min-w-0 max-w-[calc(100%_-_2.375rem)] sm:max-w-[90%]">
                  <div class="mb-1.5 flex items-center gap-2 px-1 text-[10px] font-semibold text-muted">
                    <span>CLA Assistant</span>
                    <span v-if="msg.streaming" class="text-blue-500">Writing…</span>
                    <span v-else-if="msg.mode === 'ai'" class="chat-mode-badge text-violet-600 dark:text-violet-400 bg-violet-500/10">Gemini</span>
                    <span v-else-if="msg.mode === 'search'" class="chat-mode-badge text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">Web</span>
                    <span v-else-if="msg.mode === 'local'" class="chat-mode-badge text-blue-600 dark:text-blue-400 bg-blue-500/10">Local</span>
                    <span v-else-if="msg.mode === 'memory'" class="chat-mode-badge text-amber-600 dark:text-amber-400 bg-amber-500/10">Cached</span>
                  </div>

                  <div
                    :class="[
                      'px-4 py-3 text-[13.5px] leading-relaxed rounded-[1.25rem] rounded-tl-md border shadow-sm transition-colors',
                      msg.error
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-main'
                        : 'bg-white/95 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/70 text-main'
                    ]"
                  >
                    <div
                      :class="['markdown-body break-words', msg.streaming && 'is-streaming']"
                      v-html="renderMarkdown(msg.content)"
                      @click="handleMarkdownClick"
                    ></div>

                    <div v-if="msg.content && msg.content.includes('#resume') && !msg.streaming" class="mt-3 pt-3 border-t border-main/10">
                      <button @click="openModal()" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all">
                        <FileText :size="14" />
                        <span>View resume</span>
                      </button>
                    </div>

                    <div v-if="msg.sources?.length && !msg.streaming" class="mt-3 pt-3 border-t border-main/10 flex flex-wrap gap-1.5">
                      <template v-for="source in msg.sources" :key="source.url || source.label">
                        <a
                          v-if="source.url"
                          :href="source.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          :title="source.label"
                          class="inline-flex items-center gap-1.5 max-w-[180px] text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <ExternalLink :size="10" class="flex-shrink-0" />
                          <span class="truncate">{{ sourceHost(source.url) || source.label }}</span>
                        </a>
                        <span v-else class="text-[9px] font-bold uppercase tracking-wider text-muted bg-main/5 px-2 py-1 rounded-lg">{{ source.label }}</span>
                      </template>
                    </div>
                  </div>

                  <div v-if="msg.id !== 'welcome' && !msg.streaming" class="flex items-center gap-0.5 mt-1 ml-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button @click="copyMessage(msg)" :title="copiedId === msg.id ? 'Copied!' : 'Copy response'" aria-label="Copy response" class="chat-message-action">
                      <Check v-if="copiedId === msg.id" :size="13" class="text-emerald-500" />
                      <Copy v-else :size="13" />
                    </button>
                    <button v-if="msg.error && msg.retryQuery" @click="retry(msg)" title="Retry response" aria-label="Retry response" class="chat-message-action">
                      <RotateCcw :size="13" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Starter actions appear only before the first message -->
          <div v-if="!hasConversation" class="ml-9 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              v-for="item in quickActions"
              :key="item.label"
              @click="item.action"
              class="group/shortcut inline-flex items-center gap-2 rounded-xl border border-main/15 bg-white/70 dark:bg-slate-900/60 px-3 py-2.5 text-left text-xs font-semibold text-main hover:border-blue-500/40 hover:bg-blue-500/5 transition-all active:scale-[0.98]"
            >
              <component :is="item.icon" :size="14" class="text-blue-500" />
              <span>{{ item.label }}</span>
            </button>
          </div>

          <!-- Typing indicator dots -->
          <div v-if="showTypingDots" class="flex items-end gap-2.5 msg-enter">
            <div class="h-7 w-7 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles :size="13" />
            </div>
            <div class="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/70 px-4 py-3 rounded-[1.25rem] rounded-bl-md shadow-sm flex items-center gap-1.5">
              <span class="typing-dot"></span><span class="typing-dot" style="animation-delay: 0.15s"></span><span class="typing-dot" style="animation-delay: 0.3s"></span>
              <span class="text-[11px] font-medium text-muted ml-1.5">Thinking</span>
            </div>
          </div>
        </div>

        <!-- Suggestions and composer -->
        <div class="chat-composer px-3.5 pt-3 pb-3 border-t border-main/15 bg-app/95 backdrop-blur-xl flex flex-col gap-2.5">
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5" aria-label="Suggested questions">
            <Sparkles :size="12" class="text-blue-500 flex-shrink-0" />
            <button
              v-for="(suggestion, index) in activeSuggestions"
              :key="`suggest-${index}-${suggestion}`"
              :id="`chat-suggestion-${index}`"
              @click="sendSuggestion(suggestion)"
              class="whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-full border border-main/15 bg-main/[0.035] text-[11px] font-medium text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 active:scale-[0.98] transition-all"
            >
              {{ suggestionLabel(suggestion) }}
            </button>
          </div>

          <!-- Input Bar -->
          <form
            @submit.prevent="sendMessage()"
            class="relative flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1.5 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/60 transition-all shadow-sm"
          >
            <label for="chat-input" class="sr-only">Message</label>
            <textarea
              id="chat-input"
              ref="textareaRef"
              v-model="query"
              rows="1"
              maxlength="1000"
              placeholder="Message CLA Assistant…"
              @input="autoResize"
              @keydown="handleKeydown"
              class="w-full bg-transparent resize-none py-2.5 pl-3 pr-1 text-sm leading-relaxed text-main placeholder:text-muted/70 focus:outline-none max-h-32"
            ></textarea>
            
            <button
              v-if="isLoading"
              id="chat-stop-btn"
              type="button"
              @click="stopGenerating"
              title="Stop generating"
              aria-label="Stop generating"
              class="h-10 w-10 flex-shrink-0 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Square :size="12" fill="currentColor" />
            </button>
            <button
              v-else
              id="chat-send-btn"
              type="submit"
              :disabled="!query.trim()"
              aria-label="Send message"
              class="h-10 w-10 flex-shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/20 transition-all disabled:opacity-35 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Send :size="16" class="ml-0.5" />
            </button>
          </form>

          <div class="flex items-center justify-between gap-3 text-[10px] text-muted px-1">
            <span>AI responses may need verification.</span>
            <span v-if="query.length > 700" :class="query.length > 900 ? 'text-amber-500 font-semibold' : ''">{{ query.length }}/1000</span>
            <span v-else>Enter to send</span>
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
        'h-14 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 group pointer-events-auto relative',
        isOpen ? 'hidden md:flex w-14 bg-slate-100 dark:bg-slate-800 text-muted hover:text-main border border-main/20' : 'w-14 sm:w-auto sm:px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
      ]"
    >
      <MessageSquare v-if="!isOpen" :size="22" />
      <X v-else :size="24" />
      <span v-if="!isOpen" class="hidden sm:inline text-sm font-semibold">Ask CLA</span>
      <span v-if="!isOpen && !hasConversation" class="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-[3px] border-app rounded-full"></span>
    </button>
  </div>
</template>

<style scoped>
.chat-shell {
  background-image:
    radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.08), transparent 32%),
    radial-gradient(circle at 0% 100%, rgba(59, 130, 246, 0.06), transparent 28%);
}

.chat-header {
  background: color-mix(in srgb, var(--card-bg) 88%, transparent);
  backdrop-filter: blur(18px);
}

.chat-canvas {
  background:
    linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.035)),
    var(--bg-app);
}

.chat-icon-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.chat-icon-btn:hover {
  color: var(--text-main);
  background: color-mix(in srgb, var(--text-main) 7%, transparent);
}

.chat-icon-btn:active { transform: scale(0.94); }

.chat-mode-badge {
  padding: 0.125rem 0.4rem;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.chat-message-action {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: color 160ms ease, background-color 160ms ease;
}

.chat-message-action:hover {
  color: var(--text-main);
  background: color-mix(in srgb, var(--text-main) 7%, transparent);
}

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

@media (max-width: 767px) {
  .chat-shell { height: 100dvh; }
  .chat-header { padding-top: max(0.875rem, env(safe-area-inset-top)); }
  .chat-composer { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
}

@media (prefers-reduced-motion: reduce) {
  .msg-enter,
  .typing-dot,
  :deep(.markdown-body.is-streaming > :last-child::after) {
    animation: none !important;
  }
}

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
