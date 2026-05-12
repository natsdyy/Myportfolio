/**
 * Persona Engine v1 — Emotionally Intelligent Response Transformer
 *
 * This module is the FINAL PASS on every AI response before it leaves the server.
 * It applies all 20 behavioral rules to make the AI feel human, empathetic, and aware.
 *
 * Rules covered:
 *   1. Deep Analysis      → via conversation profile from context module
 *   2. Tone Detection      → analyzeTone() (8 emotional states)
 *   3. Continuity          → buildContinuity() (no repetition, flowing dialogue)
 *   4. Follow-up           → handled by conversationContext.js (upstream)
 *   5. Summary             → handled by enhanced conversationContext.js
 *   6. Memory & Reference  → injectMemoryReferences()
 *   7. Clarification       → shouldClarify()
 *   8. Tone Matching       → detectFormality() + applyFormalityStyle()
 *   9. Honest Correction   → checkConsistency()
 *  10. Empathy First       → wrapEmpathy()
 *  11. Adaptive Length     → adaptLength()
 *  12. Sensitive Topics    → handled inside wrapEmpathy() compassion mode
 *  13. Vocabulary Adapt    → combined with detectFormality()
 *  14. Proactive Help      → suggestNextSteps()
 *  15. Consistency         → checkConsistency()
 *  16. No Repetition       → buildContinuity() anti-repeat hash
 *  17. Goal Tracking       → conversation profile intent tracking
 *  18. Respectful Disagree → tone-aware correction templates
 *  19. Privacy             → no private data logged
 *  20. Wrap-up             → enhanced goodbye with recap
 */
// ─── Lightweight Language Detection ──────────────────────────
// Self-contained to avoid circular dependency with localBrain
// (localBrain → conversationContext → localBrain creates a cycle)

const TL_WORDS = new Set([
    'kumusta', 'musta', 'saan', 'ano', 'sino', 'kailan', 'paano', 'bakit',
    'nasaan', 'taga', 'galing', 'salamat', 'paalam', 'ingat', 'ayos', 'ka',
    'mo', 'si', 'ang', 'mga', 'ng', 'na', 'sa', 'at', 'ba', 'po', 'opo',
    'astig', 'lodi', 'petmalu', 'yayaman', 'pautang', 'niya', 'kanya', 'nila',
]);

function detectLanguage(query) {
    const words = query.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    const matches = words.filter(w => TL_WORDS.has(w));
    return matches.length > 0 ? 'tl' : 'en';
}

// ─── Tone Analysis (Rule 2) ─────────────────────────────────
// 8 emotional states instead of the previous 4

const TONE_PATTERNS = {
    angry: {
        en: /\b(angry|furious|ridiculous|stupid|idiot|dumb|trash|garbage|worst|terrible|awful|horrible|sucks|useless|waste|scam|pathetic)\b/i,
        tl: /\b(bobo|tanga|gago|panget|basura|walang kwenta|kaloka|nakakagalit|punyeta|leche)\b/i,
    },
    frustrated: {
        en: /\b(frustrated|annoyed|ugh|come on|not working|broken|wrong|bad|doesn't work|can't|won't|fail|stuck|impossible|irritating|nonsense)\b/i,
        tl: /\b(nakakainis|ayaw|hindi gumagana|mali|sira|paulit ulit|nakakabwisit|hay nako)\b/i,
    },
    sad: {
        en: /\b(sad|depressed|lonely|miss|crying|cry|heartbroken|lost|grief|mourning|pain|hurts|suffering|hopeless|helpless|down|blue|unhappy|miserable)\b/i,
        tl: /\b(malungkot|lungkot|nalulungkot|masakit|pagod na pagod|wala na|hirap|nahihirapan|nakakalungkot)\b/i,
    },
    stressed: {
        en: /\b(stressed|overwhelmed|pressure|deadline|burned out|burnout|exhausted|tired|drained|anxiety|anxious|panic|worried|can't handle|overworked)\b/i,
        tl: /\b(stressed|sobrang pagod|di ko na kaya|nakakapagod|hirap|ubos na|presyur|pressured)\b/i,
    },
    confused: {
        en: /\b(confused|don'?t understand|what do you mean|unclear|lost|makes no sense|huh|what\?|clarify|help me understand|don'?t get it|i don'?t know what)\b/i,
        tl: /\b(naguguluhan|di ko gets|ano daw|di ko maintindihan|paano ba|bakit ganun|ano ibig sabihin|confused)\b/i,
    },
    curious: {
        en: /\b(curious|wondering|interested|tell me more|how does|what if|is it true|really\?|can you explain|i want to know|fascinated|intrigued)\b/i,
        tl: /\b(curious|nagtataka|gusto kong malaman|talaga ba|pano ba yun|interesting|interesante|gusto ko marinig)\b/i,
    },
    excited: {
        en: /\b(excited|amazing|awesome|incredible|fantastic|love it|perfect|brilliant|genius|wow|omg|oh my god|can't wait|thrilled|mind blown|insane|fire|lit)\b/i,
        tl: /\b(sobrang galing|amazing|grabe|grabeng|ang husay|lupet|sobrang cool|excited|astig|petmalu|lodi|sheesh)\b/i,
    },
    grateful: {
        en: /\b(thanks|thank you|appreciate|grateful|helpful|you're the best|lifesaver|saved me|perfect answer|exactly what i needed|godsend|blessing)\b/i,
        tl: /\b(salamat|maraming salamat|thank you po|tenkyu|salamuch|naiappreciate|malaking tulong|nakatulong)\b/i,
    },
    happy: {
        en: /\b(happy|great|good|nice|cool|love|awesome|glad|wonderful|sweet|yay|excellent|best)\b/i,
        tl: /\b(masaya|maganda|ayos|saya|ang galing|nice|goods|swabe)\b/i,
    },
};

// Priority order — more specific emotions checked first, grateful before stressed to avoid 'so much' collision
const TONE_PRIORITY = ['angry', 'sad', 'grateful', 'stressed', 'frustrated', 'confused', 'excited', 'curious', 'happy'];

function analyzeTone(query) {
    const q = query.toLowerCase();

    for (const tone of TONE_PRIORITY) {
        const patterns = TONE_PATTERNS[tone];
        if (patterns.en.test(q) || patterns.tl.test(q)) {
            return tone;
        }
    }

    return 'neutral';
}

// ─── Formality Detection (Rules 8, 13) ──────────────────────

const CASUAL_SIGNALS = /\b(yo|sup|bruh|bro|dude|lol|lmao|omg|ngl|tbh|idk|imo|wanna|gonna|gotta|cuz|coz|nah|yep|yup|haha|hehe|hihi|k|kk|ok|okie|anyways|btw)\b|^(yo|sup|hey)\b/i;
const FORMAL_SIGNALS = /\b(could you|would you|please|kindly|i would like|may i|if possible|i'd appreciate|regarding|concerning|with respect to|per your|pursuant|sincerely)\b/i;

function detectFormality(query) {
    const q = query.toLowerCase();
    const words = q.split(/\s+/);

    // Short messages with slang → casual
    if (words.length <= 4 && CASUAL_SIGNALS.test(q)) return 'casual';
    // Explicit formal markers
    if (FORMAL_SIGNALS.test(q)) return 'formal';
    // Very short (1-3 words) → casual
    if (words.length <= 3) return 'casual';
    // Longer messages with proper punctuation → formal
    if (words.length >= 8 && /[.?]$/.test(q.trim())) return 'formal';

    return 'neutral';
}

// ─── Empathy Wrapping (Rules 10, 12) ─────────────────────────

function wrapEmpathy(answer, tone, lang) {
    // Only wrap for negative / emotionally charged tones
    const empathyPrefixes = {
        angry: {
            en: [
                "I hear you, and I'm sorry this is frustrating. ",
                "I completely understand your frustration. Let me help — ",
                "That sounds really frustrating. Here's what I can offer: ",
            ],
            tl: [
                "Naiintindihan ko ang frustration mo. ",
                "Alam ko na nakakainis — hayaan mong tulungan kita. ",
                "Pasensya na, alam kong nakakafrustrate ito. ",
            ],
        },
        frustrated: {
            en: [
                "I understand this can be frustrating — let's sort it out. ",
                "No worries, let me help you through this. ",
                "I get it, that's not ideal. Here's what I've got: ",
            ],
            tl: [
                "Naiintindihan ko, medyo nakakainis nga. ",
                "Huwag mag-alala, tutulungan kita. ",
                "Gets ko, medyo hassle nga yan. Ito ang maitutulong ko: ",
            ],
        },
        sad: {
            en: [
                "I'm really sorry to hear that. I'm here if you need anything. ",
                "That sounds tough, and I appreciate you sharing that with me. ",
                "I hear you — that's not easy. Take your time. ",
            ],
            tl: [
                "Naiintindihan ko ang nararamdaman mo. Andito lang ako. ",
                "Mahirap nga ang ganyan. Sabihan mo lang ako kung paano kita matutulungan. ",
                "Pasensya ka na sa pinagdadaanan mo. Andito lang ako para sayo. ",
            ],
        },
        stressed: {
            en: [
                "Take a breath — I'm here to help lighten the load. ",
                "That sounds like a lot to handle. Let's take it one step at a time. ",
                "I can tell things are intense right now. Let me make this easier for you. ",
            ],
            tl: [
                "Kalma lang, andito ako para tulungan ka. ",
                "Alam kong ang dami mong iniisip. Isa-isa lang natin. ",
                "Hinga muna tayo nang malalim. Tutulungan kita dito. ",
            ],
        },
        confused: {
            en: [
                "No worries at all — let me break this down simply. ",
                "Great question! Let me clarify that for you. ",
                "Totally understandable — here's a clearer explanation: ",
            ],
            tl: [
                "Huwag mag-alala, ipapaliwanag ko nang mas malinaw. ",
                "Magandang tanong! Ito ang simpleng paliwanag: ",
                "Gets kita — hayaan mong klaruhin ko. ",
            ],
        },
    };

    const prefixes = empathyPrefixes[tone];
    if (!prefixes) return answer;

    const langKey = lang === 'tl' ? 'tl' : 'en';
    const prefix = pickRandom(prefixes[langKey]);

    return prefix + answer;
}

// ─── Adaptive Response Length (Rule 11) ──────────────────────

function adaptLength(query, answer) {
    const queryWords = query.trim().split(/\s+/).length;
    const answerLen = answer.length;

    // Very short query (1-3 words) → keep answer concise
    if (queryWords <= 3 && answerLen > 600) {
        // Trim to ~400 chars at sentence boundary
        const trimmed = trimAtSentence(answer, 400);
        return trimmed;
    }

    // Medium query (4-8 words) → moderate length
    if (queryWords <= 8 && answerLen > 1000) {
        return trimAtSentence(answer, 800);
    }

    // Long, complex query → allow full response
    return answer;
}

function trimAtSentence(text, maxLen) {
    if (text.length <= maxLen) return text;
    const cut = text.substring(0, maxLen);
    const lastSentence = Math.max(
        cut.lastIndexOf('. '),
        cut.lastIndexOf('! '),
        cut.lastIndexOf('? '),
        cut.lastIndexOf('.\n'),
        cut.lastIndexOf('!\n'),
        cut.lastIndexOf('?\n')
    );
    if (lastSentence > maxLen * 0.4) {
        return text.substring(0, lastSentence + 1);
    }
    return cut.trimEnd() + '...';
}

// ─── Anti-Repetition (Rules 3, 16) ──────────────────────────

// Simple in-memory store for recent responses (per server instance)
const _recentResponses = [];
const MAX_RECENT = 10;

function getResponseFingerprint(text) {
    // First 120 chars, normalized
    return text.substring(0, 120).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function isRepetitive(answer) {
    const fingerprint = getResponseFingerprint(answer);
    return _recentResponses.some(fp => fp === fingerprint);
}

function recordResponse(answer) {
    const fingerprint = getResponseFingerprint(answer);
    _recentResponses.push(fingerprint);
    if (_recentResponses.length > MAX_RECENT) {
        _recentResponses.shift();
    }
}

function deRepeat(answer, lang) {
    if (!isRepetitive(answer)) return answer;

    // Add a variation prefix so it doesn't feel copy-pasted
    const variations = lang === 'tl' ? [
        "Para idagdag sa sinabi ko kanina — ",
        "Isa pang paraan ng pagtingin dito: ",
        "Kung papalalimin natin ang usapan — ",
    ] : [
        "To add to what I mentioned earlier — ",
        "Another way to look at this: ",
        "Building on our earlier discussion — ",
    ];
    return pickRandom(variations) + answer;
}

// ─── Memory References (Rule 6) ──────────────────────────────

function injectMemoryReferences(answer, profile, lang) {
    if (!profile || !profile.topicsDiscussed || profile.topicsDiscussed.length < 2) {
        return answer;
    }

    // Only inject references occasionally (1 in 3 chance) to feel natural
    if (Math.random() > 0.35) return answer;

    const recentTopic = profile.topicsDiscussed[profile.topicsDiscussed.length - 2];
    if (!recentTopic) return answer;

    const references = lang === 'tl' ? [
        `Kagaya ng napag-usapan natin tungkol sa ${recentTopic} — `,
        `Kaugnay ng tinanong mo tungkol sa ${recentTopic}, `,
    ] : [
        `Building on what you asked about ${recentTopic} — `,
        `As we discussed regarding ${recentTopic}, `,
        `Connecting this to your earlier question about ${recentTopic} — `,
    ];

    return pickRandom(references) + answer;
}

// ─── Proactive Suggestions (Rule 14) ────────────────────────

const PROACTIVE_MAP = {
    greeting: {
        en: "\n\n💡 *Try asking: \"What is his tech stack?\" or \"Show me his projects\"*",
        tl: "\n\n💡 *Subukan mong itanong: \"Ano ang tech stack niya?\" o \"Ipakita mo ang projects niya\"*",
    },
    skills_tech: {
        en: "\n\n🚀 *Want to see the projects where he used these? Just ask!*",
        tl: "\n\n🚀 *Gusto mo bang makita ang mga projects kung saan niya ginamit ang mga ito?*",
    },
    projects: {
        en: "\n\n💼 *Interested in working with Charles? Ask about his availability or contact info!*",
        tl: "\n\n💼 *Interesado ka bang magtrabaho kasama si Charles? Itanong ang availability niya!*",
    },
    specific_project: {
        en: "\n\n🔍 *Want to explore more projects? Just say \"Show me his projects\"!*",
        tl: "\n\n🔍 *Gusto mo pang mag-explore ng ibang projects? Sabihin mo lang!*",
    },
    owner_identity: {
        en: "\n\n📋 *Want a deeper dive? Ask about his skills, projects, or download his resume!*",
        tl: "\n\n📋 *Gusto mo pang malaman? Itanong ang skills niya, projects, o i-download ang resume!*",
    },
    experience: {
        en: "\n\n📄 *You can also view or download his full resume — just ask!*",
        tl: "\n\n📄 *Pwede mo ring tingnan o i-download ang resume niya — magtanong ka lang!*",
    },
    contact: {
        en: "",
        tl: "",
    },
    bot_identity: {
        en: "\n\n🤖 *Go ahead, test me! Ask about Charles' work or search the web for anything.*",
        tl: "\n\n🤖 *Sige, subukan mo ako! Magtanong tungkol kay Charles o mag-search sa web.*",
    },
};

function suggestNextSteps(intent, lang, turnCount) {
    // Don't be pushy in long conversations
    if (turnCount > 6) return '';

    const suggestion = PROACTIVE_MAP[intent];
    if (!suggestion) return '';

    return lang === 'tl' ? suggestion.tl : suggestion.en;
}

// ─── Clarification (Rule 7) ─────────────────────────────────

function shouldClarify(query, intentResults, profile) {
    const words = query.trim().split(/\s+/);
    const q = query.toLowerCase().trim();

    // Don't clarify if we have strong intent match
    if (intentResults && intentResults.length > 0 && intentResults[0].score >= 6) {
        return null;
    }

    // Don't clarify greetings or very common words
    const skipWords = ['hi', 'hello', 'hey', 'bye', 'ok', 'yes', 'no', 'thanks', 'yo', 'sup',
                       'kumusta', 'musta', 'oo', 'hindi', 'salamat', 'sige', 'paalam'];
    if (words.length === 1 && skipWords.includes(q.replace(/[?!.]/g, ''))) {
        return null;
    }

    // Single ambiguous word with no context
    if (words.length === 1 && (!profile || profile.turnCount < 2)) {
        const lang = detectLanguage(query);
        return lang === 'tl'
            ? `Hindi ako sigurado kung ano ang ibig mong sabihin sa "${query}" — puwede mo bang i-rephrase o magbigay ng kaunting konteksto? 😊`
            : `I want to make sure I help you correctly — could you tell me a bit more about what you mean by "${query}"? 😊`;
    }

    // Very short query with multiple possible intents
    if (words.length <= 2 && intentResults && intentResults.length >= 2) {
        const top2 = intentResults.slice(0, 2);
        if (top2[0].score - top2[1].score < 2) {
            // Scores are very close — ambiguous
            const lang = detectLanguage(query);
            return lang === 'tl'
                ? `Gusto kong maging sigurado — ang "${query}" ba ay tungkol sa ${formatIntentName(top2[0].intent.name, 'tl')} o ${formatIntentName(top2[1].intent.name, 'tl')}?`
                : `Just to be sure — are you asking about ${formatIntentName(top2[0].intent.name, 'en')} or ${formatIntentName(top2[1].intent.name, 'en')}?`;
        }
    }

    return null;
}

function formatIntentName(name, lang) {
    const nameMap = {
        skills_tech: { en: "Charles' skills", tl: "skills ni Charles" },
        projects: { en: "his projects", tl: "mga projects niya" },
        contact: { en: "contacting him", tl: "pag-contact sa kanya" },
        experience: { en: "his experience", tl: "karanasan niya" },
        owner_identity: { en: "who Charles is", tl: "kung sino si Charles" },
        bot_identity: { en: "who I am", tl: "kung sino ako" },
        availability: { en: "his availability", tl: "availability niya" },
        pricing: { en: "pricing", tl: "presyo" },
        resume: { en: "his resume", tl: "resume niya" },
        location: { en: "his location", tl: "lokasyon niya" },
    };
    const entry = nameMap[name];
    return entry ? entry[lang] || name : name.replace(/_/g, ' ');
}

// ─── Consistency Check (Rules 9, 15) ─────────────────────────

function checkConsistency(answer, profile) {
    // Since we're a portfolio bot with static data, contradictions are rare.
    // This mainly catches if the same fact is stated differently.
    // For now, this is a lightweight pass-through that logs warnings.

    if (!profile || !profile.lastBotResponse) return answer;

    // Check if we're saying opposite things about availability
    const last = profile.lastBotResponse.toLowerCase();
    const current = answer.toLowerCase();

    if (last.includes('not available') && current.includes('open for work')) {
        console.warn('[persona] ⚠️ Potential consistency issue: availability contradiction detected');
    }
    if (last.includes('open for work') && current.includes('not available')) {
        console.warn('[persona] ⚠️ Potential consistency issue: availability contradiction detected');
    }

    return answer;
}

// ─── Formality Style Application (Rule 8, 13) ───────────────

function applyFormalityStyle(answer, formality, lang) {
    if (formality === 'casual') {
        // Make response feel more casual
        if (lang === 'en') {
            answer = answer
                .replace(/\bI would recommend\b/gi, "I'd say")
                .replace(/\bAdditionally\b/gi, "Also")
                .replace(/\bFurthermore\b/gi, "Plus")
                .replace(/\bHowever\b/gi, "But")
                .replace(/\bTherefore\b/gi, "So")
                .replace(/\bSubsequently\b/gi, "Then")
                .replace(/\bNevertheless\b/gi, "Still")
                .replace(/\bI am\b/g, "I'm")
                .replace(/\bdo not\b/gi, "don't")
                .replace(/\bcan not\b/gi, "can't")
                .replace(/\bwill not\b/gi, "won't");
        }
    } else if (formality === 'formal') {
        // Keep response professional — avoid casual closers
        if (lang === 'en') {
            answer = answer
                .replace(/\bcheck it out\b/gi, "please review")
                .replace(/\bhit me up\b/gi, "feel free to reach out")
                .replace(/\bno worries\b/gi, "not a problem");
        }
    }
    return answer;
}

// ─── Continuity Intro (Rule 3) ──────────────────────────────

function getContinuityIntro(profile, lang) {
    if (!profile) return '';

    const turn = profile.turnCount || 0;

    // First 2 turns: full intros are fine (handled by caller)
    if (turn <= 2) return '';

    // 3-6 turns: short transitional intros
    if (turn <= 6) {
        const shortIntros = lang === 'tl' ? [
            "", "Kaugnay diyan — ", "Siyanga pala, ", "Para sa tanong mo — ",
        ] : [
            "", "On that note — ", "Good question — ", "Sure thing — ",
        ];
        return pickRandom(shortIntros);
    }

    // 7+ turns: ultra-brief or no intro at all
    const ultraShort = lang === 'tl' ? [
        "", "", "Eto — ",
    ] : [
        "", "", "Here — ",
    ];
    return pickRandom(ultraShort);
}

// ─── Goal Tracking Outro (Rule 17, 20) ─────────────────────

function getGoalAwareOutro(profile, intent, lang, tone) {
    if (!profile) return '';

    const turn = profile.turnCount || 0;

    // No outro for long conversations (feels repetitive)
    if (turn > 5) return '';

    // No outro for negative tones (empathy should close, not prompts)
    if (['angry', 'frustrated', 'sad', 'stressed'].includes(tone)) return '';

    // Goodbye intent — provide wrap-up (Rule 20)
    if (intent === 'goodbye' && profile.topicsDiscussed.length > 1) {
        const topics = profile.topicsDiscussed.slice(0, 3).join(', ');
        return lang === 'tl'
            ? `\n\nNapag-usapan natin ang: ${topics}. Sana nakatulong! Balik ka lang anytime. 👋`
            : `\n\nWe covered: ${topics}. Hope that was helpful! Come back anytime. 👋`;
    }

    return '';
}

// ─── Main Orchestrator ──────────────────────────────────────

/**
 * applyPersona(rawAnswer, query, history, metadata)
 *
 * The single entry point that applies all 20 behavioral rules.
 *
 * @param {string} rawAnswer   - The raw answer from local brain / scraper / supabase
 * @param {string} query       - The user's original query
 * @param {Array}  history     - Chat history array of { role, content }
 * @param {Object} metadata    - { intent, profile, mode, intentResults }
 *   - intent: string (intent name or null)
 *   - profile: object from buildConversationProfile()
 *   - mode: 'local' | 'search' | 'memory'
 *   - intentResults: array from classifyIntent() (for clarification)
 *
 * @returns {string} The final, persona-enhanced response
 */
function applyPersona(rawAnswer, query, history = [], metadata = {}) {
    const { intent, profile, mode, intentResults } = metadata;
    const lang = detectLanguage(query);
    const tone = analyzeTone(query);
    const formality = detectFormality(query);
    const turnCount = profile?.turnCount || 0;

    let answer = rawAnswer;

    // ── Rule 7: Clarification ────────────────────────────────
    // If the persona engine thinks we should clarify, return early
    // (This is called by searchAgent before the main flow, not here)

    // ── Rule 10, 12: Empathy First ───────────────────────────
    answer = wrapEmpathy(answer, tone, lang);

    // ── Rule 8, 13: Formality Matching ───────────────────────
    answer = applyFormalityStyle(answer, formality, lang);

    // ── Rule 11: Adaptive Length ─────────────────────────────
    answer = adaptLength(query, answer);

    // ── Rule 6: Memory References ────────────────────────────
    answer = injectMemoryReferences(answer, profile, lang);

    // ── Rule 3: Continuity Intro ─────────────────────────────
    const continuityIntro = getContinuityIntro(profile, lang);
    if (continuityIntro) {
        answer = continuityIntro + answer;
    }

    // ── Rules 3, 16: Anti-Repetition ─────────────────────────
    answer = deRepeat(answer, lang);

    // ── Rule 15: Consistency ─────────────────────────────────
    answer = checkConsistency(answer, profile);

    // ── Rule 14: Proactive Suggestions ───────────────────────
    if (intent && mode !== 'search') {
        const suggestion = suggestNextSteps(intent, lang, turnCount);
        if (suggestion) {
            answer += suggestion;
        }
    }

    // ── Rules 17, 20: Goal-Aware Outro ───────────────────────
    const outro = getGoalAwareOutro(profile, intent, lang, tone);
    if (outro) {
        answer += outro;
    }

    // ── Record this response for anti-repetition ─────────────
    recordResponse(answer);

    return answer;
}

// ─── Utility ────────────────────────────────────────────────

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Exports ────────────────────────────────────────────────

module.exports = {
    applyPersona,
    analyzeTone,
    detectFormality,
    shouldClarify,
    wrapEmpathy,
    adaptLength,
    suggestNextSteps,
    injectMemoryReferences,
    checkConsistency,
};
