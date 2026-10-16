import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

import { createSseParser } from '../src/utils/sseParser.js'

const require = createRequire(import.meta.url)
const { classifyIntent, tryLocalAnswer } = require('../server/src/ai/fallback/localBrain.js')
const { processUserQuery } = require('../server/src/ai/fallback/localAgent.js')
const { buildConversationProfile, isFollowUp } = require('../server/src/ai/fallback/conversationContext.js')
const { buildSystemPrompt } = require('../server/src/ai/systemPrompt.js')

test('prioritizes portfolio intents over conversational filler', () => {
  assert.equal(classifyIntent('Can I see his resume?')[0]?.intent.name, 'resume')
  assert.equal(classifyIntent('Why should we hire him?')[0]?.intent.name, 'hiring_fit')
  assert.equal(classifyIntent('Does Charles know Python?')[0]?.intent.name, 'skill_check')
})

test('returns one focused response instead of joining unrelated intents', () => {
  const answer = tryLocalAnswer('Hi, who is Charles?')
  assert.match(answer, /Charles Louie Alvaran/)
  assert.doesNotMatch(answer, /\n---\n/)
  assert.doesNotMatch(answer, /I'm \*\*CLA Assistant\*\*/)
})

test('does not invent unsupported skills', () => {
  const answer = tryLocalAnswer('Does Charles know Python?')
  assert.match(answer, /Python/)
  assert.match(answer, /not listed/i)
  assert.match(answer, /can't confirm/i)
})

test('answers recruiter questions with portfolio evidence', () => {
  const answer = tryLocalAnswer('Why should we hire him?')
  assert.match(answer, /full-stack engineering/i)
  assert.match(answer, /ERP workflows/i)
  assert.match(answer, /#resume/)
})

test('cached answers do not invent conversation continuity', async () => {
  const first = await processUserQuery('How can I contact him?', [])
  const second = await processUserQuery('How can I contact him?', [])

  assert.equal(second.mode, 'memory')
  assert.equal(second.answer, first.answer)
  assert.doesNotMatch(second.answer, /earlier discussion|mentioned earlier/i)
})

test('parses fragmented LF and CRLF server-sent events', () => {
  const events = []
  const parser = createSseParser(event => events.push(event))

  parser.push('data: {"type":"delta","text":"Hel')
  parser.push('lo"}\r\n\r\ndata: {"type":"done",')
  parser.push('"sources":[],"mode":"local"}')
  parser.finish()

  assert.deepEqual(events, [
    { type: 'delta', text: 'Hello' },
    { type: 'done', sources: [], mode: 'local' },
  ])
})

test('builds audience, goal, entity, and depth from conversation context', () => {
  const history = [
    { role: 'user', content: 'Tell me about VibeBuilds' },
    { role: 'assistant', content: 'VibeBuilds is a PC configuration platform.' },
  ]
  const state = buildConversationProfile(history, 'Can you explain the architecture in more detail?')

  assert.equal(state.audience, 'developer')
  assert.equal(state.goal, 'explore_projects')
  assert.equal(state.activeEntity, 'VibeBuilds')
  assert.equal(state.responseDepth, 'detailed')
  assert.equal(state.isFollowUp, true)
})

test('treats a named project correction as a new subject', () => {
  const history = [
    { role: 'user', content: 'Tell me about VibeBuilds' },
    { role: 'assistant', content: 'VibeBuilds is a PC configuration platform.' },
  ]

  assert.equal(isFollowUp('No, I meant Dynbooth', history), false)
  assert.equal(buildConversationProfile(history, 'No, I meant Dynbooth').activeEntity, 'Dynbooth')
})

test('injects derived conversation guidance into the Gemini prompt', () => {
  const state = buildConversationProfile([], 'Why should we hire Charles for this role?')
  const prompt = buildSystemPrompt({
    now: new Date('2026-01-15T00:00:00Z'),
    conversationState: state,
  })

  assert.match(prompt, /Visitor type: recruiter/)
  assert.match(prompt, /Likely goal: evaluate_candidate/)
  assert.match(prompt, /Previous user turns: 0/)
})

test('keeps ongoing local replies free from repeated sales prompts', async () => {
  const history = [
    { role: 'user', content: 'Who is Charles?' },
    { role: 'assistant', content: 'Charles is a full-stack developer.' },
  ]
  const result = await processUserQuery('What is his tech stack?', history)

  assert.doesNotMatch(result.answer, /Want to see the projects where he used these/i)
})

test('answers project follow-ups directly instead of repeating the project card', async () => {
  const history = [
    { role: 'user', content: 'Tell me about VibeBuilds' },
    { role: 'assistant', content: 'VibeBuilds is a PC configuration platform.' },
  ]
  const result = await processUserQuery('What did he build it with?', history)

  assert.match(result.answer, /verified stack for \*\*VibeBuilds\*\*/i)
  assert.match(result.answer, /React TS, Node\.js/)
  assert.doesNotMatch(result.answer, /Project Spotlight/)
})

test('matches formal visitors without decorative emojis', async () => {
  const result = await processUserQuery('Could you please provide his professional experience and qualifications?', [])
  assert.doesNotMatch(result.answer, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
})
