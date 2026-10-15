/**
 * Real-time JavaScript Conversation Analyzer
 *
 * Analyzes the chat stream and user inputs to provide:
 * 1. Tone and Sentiment Detection (friendly, excited, recruiter, technical, etc.)
 * 2. Topic and Entity Extraction (projects, skills, hiring, resume, contact)
 * 3. Dynamic Contextual Smart Suggestions (tailored follow-ups based on the ongoing dialogue)
 * 4. Real-time Typing Hints (suggests matching queries while the user types)
 * 5. Visual Vibe Badge data for the UI header
 */

// Keyword definitions for topics
const TOPIC_PATTERNS = {
  projects: /\b(project|projects|system|systems|portfolio|built|created|developed|app|apps|website|websites|countryside|vibebuilds|dynbooth|ismeye|altermatch|appen|bot)\b/i,
  tech_stack: /\b(tech|stack|technology|technologies|frontend|backend|framework|library|vue|react|node|express|supabase|firebase|typescript|javascript|tailwind|docker|git|vite)\b/i,
  hiring: /\b(hire|hiring|available|availability|job|opportunity|work|freelance|contract|collaborate|role|employment|salary|rate)\b/i,
  resume: /\b(resume|cv|curriculum vitae|download resume|view resume)\b/i,
  contact: /\b(contact|email|phone|reach|message|facebook|instagram|social|call|talk)\b/i,
  experience: /\b(experience|background|education|degree|school|graduate|years|career)\b/i,
  humor: /\b(joke|jokes|funny|laugh|haha|lol|pun)\b/i,
  identity: /\b(who are you|who is charles|about charles|creator|developer|owner|cla)\b/i,
}

// Tone patterns
const TONE_PATTERNS = {
  excited: /\b(wow|cool|awesome|amazing|great|super|sick|fire|lit|lodi|petmalu|astig|sheesh|grabe|love it)\b/i,
  recruiter: /\b(hire|resume|cv|candidate|experience|background|qualifications|senior|full-time|salary|interview|employment)\b/i,
  technical: /\b(architecture|api|websocket|database|nosql|sql|postgres|state management|optimization|docker|ci\/cd|component|async|promise)\b/i,
  friendly: /\b(hi|hello|hey|sup|yo|kumusta|musta|good morning|good afternoon|good evening|thanks|thank you|salamat|buddy|friend)\b/i,
  curious: /\b(why|how come|tell me more|what about|how does|can you explain|curious|wondering|details)\b/i,
  frustrated: /\b(confused|error|broken|wrong|not working|fail|stuck|huh|what\?|di ko gets)\b/i,
}

// Language signals for Filipino / Taglish
const TL_SIGNALS = /\b(kumusta|musta|ano|sino|saan|paano|bakit|kailan|talaga|lodi|petmalu|astig|salamat|opo|po|nga|naman|din|rin|siya|niya|nila|patingin|magkano|ayos|pwede|huwag|walang)\b/i

/**
 * Detect language of the conversation
 */
export function detectLanguage(text = '') {
  return TL_SIGNALS.test(text) ? 'tl' : 'en'
}

/**
 * Detect primary topic from text
 */
export function detectTopic(text = '') {
  if (TOPIC_PATTERNS.resume.test(text)) return 'resume'
  if (TOPIC_PATTERNS.hiring.test(text)) return 'hiring'
  if (TOPIC_PATTERNS.projects.test(text)) return 'projects'
  if (TOPIC_PATTERNS.tech_stack.test(text)) return 'tech_stack'
  if (TOPIC_PATTERNS.contact.test(text)) return 'contact'
  if (TOPIC_PATTERNS.experience.test(text)) return 'experience'
  if (TOPIC_PATTERNS.humor.test(text)) return 'humor'
  if (TOPIC_PATTERNS.identity.test(text)) return 'identity'
  return 'general'
}

/**
 * Detect user tone / conversational vibe
 */
export function detectTone(text = '') {
  if (TONE_PATTERNS.recruiter.test(text)) return 'recruiter'
  if (TONE_PATTERNS.technical.test(text)) return 'technical'
  if (TONE_PATTERNS.excited.test(text)) return 'excited'
  if (TONE_PATTERNS.frustrated.test(text)) return 'frustrated'
  if (TONE_PATTERNS.curious.test(text)) return 'curious'
  if (TONE_PATTERNS.friendly.test(text)) return 'friendly'
  return 'neutral'
}

/**
 * Generate dynamic next-turn prompt suggestions based on current dialogue state
 */
export function generateDynamicSuggestions(messages = [], currentTopic = 'general', lang = 'en') {
  // If no conversation yet, return engaging starter prompts
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase())
  const allText = messages.map(m => m.content).join(' ').toLowerCase()

  if (userMessages.length === 0) {
    return lang === 'tl'
      ? [
          'Ano ang tech stack ni Charles? ⚡',
          'Ipakita ang mga top projects 🚀',
          'Available ba siya for hire? 💼',
          'Patingin ng resume niya 📄',
        ]
      : [
          "What is Charles' tech stack? ⚡",
          'Show me his top systems 🚀',
          'Is he open for work? 💼',
          'Can I see his resume? 📄',
        ]
  }

  const suggestions = []

  // Check what has already been asked to avoid duplicates
  const askedProjects = userMessages.some(m => m.includes('project') || m.includes('system') || m.includes('portfolio'))
  const askedTech = userMessages.some(m => m.includes('stack') || m.includes('tech') || m.includes('framework'))
  const askedHire = userMessages.some(m => m.includes('hire') || m.includes('available') || m.includes('freelance'))
  const askedResume = userMessages.some(m => m.includes('resume') || m.includes('cv'))
  const askedContact = userMessages.some(m => m.includes('contact') || m.includes('email') || m.includes('reach'))

  // Topic-specific follow-ups
  if (currentTopic === 'projects' || allText.includes('countryside') || allText.includes('vibebuilds')) {
    if (!allText.includes('countryside steakhouse')) suggestions.push('Tell me about Countryside Steakhouse 🍽️')
    if (!allText.includes('vibebuilds')) suggestions.push('What is VibeBuilds? 💻')
    if (!allText.includes('dynbooth')) suggestions.push('Tell me about Dynbooth 📸')
    if (!askedTech) suggestions.push('What tech does he use? 🛠️')
    if (!askedResume) suggestions.push('View Charles’ resume 📄')
  } else if (currentTopic === 'tech_stack') {
    suggestions.push('Which backend does he prefer? ⚙️')
    suggestions.push('Does he know Vue and React? 🎨')
    if (!askedProjects) suggestions.push('Show full-stack projects 🚀')
    if (!askedHire) suggestions.push('Is he open to remote roles? 🌐')
  } else if (currentTopic === 'hiring') {
    if (!askedContact) suggestions.push('How can I contact Charles directly? ✉️')
    if (!askedResume) suggestions.push('Preview / Download Resume 📄')
    suggestions.push('Where is he located? 📍')
    suggestions.push('What roles is he open to? 🎯')
  } else if (currentTopic === 'resume') {
    suggestions.push('What are his top highlights? ✨')
    if (!askedContact) suggestions.push('How can I email him? 📧')
    if (!askedProjects) suggestions.push('Show featured systems 🚀')
  } else if (currentTopic === 'contact') {
    if (!askedResume) suggestions.push('Can I download his CV? 📄')
    suggestions.push('What is his timezone? 🕐')
    if (!askedProjects) suggestions.push('Show his live portfolio work 🌐')
  }

  // Fallback engaging general suggestions
  if (suggestions.length < 3) {
    if (!askedProjects) suggestions.push('Show me his best systems 🚀')
    if (!askedTech) suggestions.push('What is his core stack? ⚡')
    if (!askedHire) suggestions.push('Is he available for hire? 💼')
    if (!askedResume) suggestions.push('Show me his resume 📄')
    suggestions.push('Tell me a fun dev joke! 😄')
  }

  // Deduplicate and take top 4
  const unique = Array.from(new Set(suggestions))
  return unique.slice(0, 4)
}

/**
 * Real-time query suggestion while typing
 */
export function getTypingSuggestions(inputText = '') {
  const q = inputText.trim().toLowerCase()
  if (!q || q.length < 2) return []

  const quickCatalog = [
    { trigger: ['stack', 'tech', 'skill', 'code', 'know'], prompt: "What is Charles' tech stack? ⚡" },
    { trigger: ['project', 'work', 'built', 'system', 'app'], prompt: 'Show me his featured web systems 🚀' },
    { trigger: ['countryside', 'steak', 'erp'], prompt: 'Tell me about Countryside Steakhouse 🍽️' },
    { trigger: ['vibe', 'pc', 'build'], prompt: 'Tell me about VibeBuilds 💻' },
    { trigger: ['dyn', 'booth', 'photo'], prompt: 'Tell me about Dynbooth 📸' },
    { trigger: ['alter', 'match'], prompt: 'Tell me about Altermatch ⚡' },
    { trigger: ['hire', 'avail', 'freelance', 'job', 'work with'], prompt: 'Is Charles available for hire? 💼' },
    { trigger: ['resume', 'cv', 'pdf', 'download'], prompt: 'Can I view or download his resume? 📄' },
    { trigger: ['contact', 'email', 'phone', 'message', 'reach'], prompt: 'How can I contact Charles? ✉️' },
    { trigger: ['where', 'locat', 'city', 'base', 'timezone'], prompt: 'Where is Charles based? 📍' },
    { trigger: ['joke', 'funny', 'laugh'], prompt: 'Tell me a programmer joke! 😄' },
  ]

  const matches = quickCatalog
    .filter(item => item.trigger.some(t => q.includes(t) || t.includes(q)))
    .map(item => item.prompt)

  return Array.from(new Set(matches)).slice(0, 3)
}

/**
 * Main Analysis Entry Point
 * Evaluates messages and input in real-time
 */
export function analyzeConversation(messages = [], currentInput = '') {
  const userMessages = messages.filter(m => m.role === 'user' && m.content)
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || currentInput || ''
  const lastBotMsg = messages.filter(m => m.role === 'assistant' && m.content).slice(-1)[0]?.content || ''

  const combinedRecent = `${lastUserMsg} ${currentInput}`.trim()
  const topic = detectTopic(combinedRecent || lastBotMsg)
  const tone = detectTone(combinedRecent)
  const lang = detectLanguage(combinedRecent || lastBotMsg)
  const turnCount = userMessages.length

  // Build the dynamic Vibe Badge for the header
  let vibeBadge = {
    label: 'Online & Ready',
    sublabel: 'Friendly AI Companion',
    color: 'emerald',
    icon: 'Sparkles',
  }

  if (tone === 'recruiter' || topic === 'hiring' || topic === 'resume') {
    vibeBadge = {
      label: 'Recruiter Mode',
      sublabel: 'Evaluating Skills & Impact',
      color: 'indigo',
      icon: 'Briefcase',
    }
  } else if (tone === 'technical' || topic === 'tech_stack') {
    vibeBadge = {
      label: 'Tech Deep Dive',
      sublabel: 'Architecture & Engineering',
      color: 'blue',
      icon: 'Code2',
    }
  } else if (topic === 'projects') {
    vibeBadge = {
      label: 'Project Spotlight',
      sublabel: 'Exploring Full-Stack Work',
      color: 'violet',
      icon: 'Rocket',
    }
  } else if (tone === 'excited') {
    vibeBadge = {
      label: 'Hyped & Excited',
      sublabel: 'Loving the tech energy! ⚡',
      color: 'amber',
      icon: 'Zap',
    }
  } else if (lang === 'tl') {
    vibeBadge = {
      label: 'Taglish Chat',
      sublabel: 'Kwentuhang Dev 🇵🇭',
      color: 'teal',
      icon: 'Smile',
    }
  } else if (turnCount > 3) {
    vibeBadge = {
      label: 'In Conversation',
      sublabel: `${turnCount} turns • Context active`,
      color: 'emerald',
      icon: 'MessageCircle',
    }
  }

  // Suggestions for user
  const suggestions = generateDynamicSuggestions(messages, topic, lang)
  const typingSuggestions = currentInput ? getTypingSuggestions(currentInput) : []

  return {
    topic,
    tone,
    lang,
    turnCount,
    vibeBadge,
    suggestions,
    typingSuggestions,
    hasContext: turnCount > 0,
  }
}
