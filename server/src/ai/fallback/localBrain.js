/**
 * Local Brain v3 — Improved Intent Classifier
 *
 * Fixes vs v2:
 *  - Normalized scoring (no raw kw.length inflation)
 *  - Priority tiebreaking on equal scores
 *  - Multi-intent support for compound queries
 *  - Memoized Levenshtein distance
 *  - Query normalization (strips punctuation, collapses spaces)
 *  - Richer result object: { intent, score, confidence }
 *  - Handler dispatch passes (query, ctx) consistently
 *  - Structured near-miss logging for continuous improvement
 */

const { owner, skills, projects, otherProjects, botIdentity } = require('../../data/knowledgeBase');
const { generateSmartSummary } = require('./conversationContext');

// ─── Constants ────────────────────────────────────────────────

const SCORE_THRESHOLD = 4;
const CONFIDENCE_THRESHOLD = 0.25; // ratio of best score to max possible

// ─── Intent Definitions ───────────────────────────────────────
// priority: lower number = wins tiebreaks (use when intents share keywords)

const intents = [
    {
        name: 'greeting',
        priority: 1,
        keywords: [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'howdy', 'greetings', 'hola', 
            'kumusta', 'musta', 'ano na', 'hoy', 'magandang umaga', 'magandang hapon', 'magandang gabi', 'uy'
        ],
        handler: handleGreeting,
    },
    {
        name: 'small_talk',
        priority: 2,
        keywords: [
            'how are you', 'hows it going', 'how do you do', 'whats up', 'what\'s up', 'how\'s it going', 
            'kumusta ka', 'musta ka', 'ayos ka lang', 'anong balita', 'kumusta na'
        ],
        handler: handleSmallTalk,
    },
    {
        name: 'uncertainty',
        priority: 1,
        keywords: [
            'ewan', 'aywan', 'idk', 'dunno', 'dont know', 'don\'t know', 'di ko alam', 'hindi ko alam', 'di alam', 'not sure', 'di sure', 'wala lang', 'wala', 'nevermind', 'nvm', 'nothing'
        ],
        handler: handleUncertainty,
    },
    {
        name: 'bot_identity',
        priority: 1,
        keywords: [
            'who are you', 'what are you', 'your name', 'what can you do', 'what do you do', 'capabilities', 'introduce yourself', 'tell me about yourself', 'are you ai', 'are you a bot', 'are you real',
            'sino ka', 'ano ka', 'anong pangalan mo', 'anong kaya mong gawin', 'ano ang trabaho mo', 'magpakilala ka'
        ],
        handler: handleBotIdentity,
    },
    {
        name: 'owner_identity',
        priority: 1,
        keywords: [
            'who is charles', 'who made you', 'who built you', 'who created you', 'about charles', 'tell me about charles', 'who is the developer', 'who is the owner', 'your creator', 'your developer', 'charles louie', 'about him', 'who is he',
            'sino si charles', 'sino gumawa sayo', 'sino ang may ari', 'tungkol kay charles', 'kilala mo ba si charles'
        ],
        handler: handleOwnerIdentity,
    },
    {
        name: 'skills_tech',
        priority: 1,
        keywords: [
            'skills', 'tech stack', 'technologies', 'programming', 'languages', 'frameworks', 'what does he know', 'what can he do', 'frontend', 'backend', 'tools', 'expertise', 'proficient', 'stack', 'coding',
            'anong alam niya', 'anong skills niya', 'anong gamit niyang tech', 'anong programming language', 'marunong ba siya mag code'
        ],
        handler: handleSkills,
    },
    {
        name: 'skill_check',
        priority: 0,
        keywords: [
            'does charles know', 'does he know', 'can charles use', 'can he use',
            'is charles familiar with', 'is he familiar with', 'marunong ba si charles',
            'marunong ba siya', 'alam ba niya'
        ],
        handler: handleSkillCheck,
    },
    {
        name: 'projects',
        priority: 1,
        keywords: [
            'projects', 'portfolio', 'work', 'built', 'created', 'developed', 'apps', 'websites', 'applications', 'show me his work',
            'mga gawa niya', 'mga project', 'anong nagawa na niya', 'pakita mo yung mga gawa niya', 'portfolio niya'
        ],
        handler: handleProjects,
    },
    {
        name: 'specific_project',
        priority: 0, // highest — very specific signals
        keywords: ['countryside steakhouse', 'countryside', 'vibebuilds', 'vibe builds', 'dynbooth', 'ismeye', 'altermatch', 'appen highlighter', 'extension', 'discord bot', 'thesis', 'figma'],
        handler: handleSpecificProject,
    },
    {
        name: 'contact',
        priority: 1,
        keywords: [
            'contact', 'email', 'reach', 'connect', 'get in touch', 'message him', 'social media', 'facebook', 'instagram', 'how to contact',
            'paano siya kontakin', 'email niya', 'paano siya imessage', 'kontak'
        ],
        handler: handleContact,
    },
    {
        name: 'hiring_fit',
        priority: 0,
        keywords: [
            'why should we hire him', 'why hire charles', 'why hire him', 'good fit',
            'strong candidate', 'qualified candidate', 'reasons to hire', 'what makes him qualified',
            'bakit siya i hire', 'bakit namin siya kukunin'
        ],
        handler: handleHiringFit,
    },
    {
        name: 'experience',
        priority: 1,
        keywords: [
            'experience', 'years', 'how long', 'career', 'background', 'education', 'degree', 'graduate', 'school', 'university', 'qualification',
            'karanasan', 'gaano na siya katagal', 'anong tinapos niya', 'saan siya nag aral', 'background niya'
        ],
        handler: handleExperience,
    },
    {
        name: 'resume',
        priority: 0,
        keywords: ['resume', 'cv', 'curriculum vitae', 'download resume', 'view resume', 'patingin ng resume', 'resume niya'],
        handler: handleResume,
    },
    {
        name: 'availability',
        priority: 1,
        keywords: [
            'available', 'hiring', 'open for work', 'freelance', 'job', 'work with', 'collaborate', 'open to', 'looking for work', 'employment',
            'pwede ba siya', 'available ba siya', 'naghahanap ba siya ng trabaho', 'pwede ba siya hire'
        ],
        handler: handleAvailability,
    },
    {
        name: 'location',
        priority: 1,
        keywords: [
            'where are you from', 'where are you', 'where do you live', 'where is he', 'location', 'based', 'where does he live', 'country', 'city', 'philippines', 'cavite', 'timezone', 
            'taga saan ka', 'saan ka galing', 'nasaan ka', 'nasaan si charles', 'saan siya nakatira', 'saan siya nakabase'
        ],
        handler: handleLocation,
    },
    {
        name: 'thanks',
        priority: 2,
        keywords: [
            'thanks', 'thank you', 'appreciate', 'helpful', 'awesome', 'nice work', 'cool', 'good job', 'amazing', 'wonderful', 'great job', 
            'salamat', 'maraming salamat', 'thank you po', 'tenkyu', 'salamuch'
        ],
        handler: handleThanks,
    },
    {
        name: 'goodbye',
        priority: 1,
        keywords: [
            'bye', 'goodbye', 'see you', 'later', 'take care', 'gtg', 'gotta go', 'cya', 'peace', 'im out', 
            'paalam', 'alis na ako', 'ingat', 'sige'
        ],
        handler: handleGoodbye,
    },
    {
        name: 'help',
        priority: 1,
        keywords: [
            'help', 'how to use', 'what can i ask', 'commands', 'features', 'menu', 'options',
            'tulong', 'paano kita gagamitin', 'anong pwede kong itanong'
        ],
        handler: handleHelp,
    },
    {
        name: 'compliment',
        priority: 2,
        keywords: [
            'smart', 'impressive', 'wow', 'cool portfolio', 'nice website', 'beautiful', 'well done', 'talented', 'genius', 'brilliant',
            'ang galing', 'husay', 'petmalu', 'lodi'
        ],
        handler: handleCompliment,
    },
    {
        name: 'joke',
        priority: 1,
        keywords: ['joke', 'funny', 'make me laugh', 'humor', 'tell me a joke', 'something funny', 'magbiro ka', 'joke tayo'],
        handler: handleJoke,
    },
    {
        name: 'hobbies',
        priority: 1,
        keywords: ['hobbies', 'free time', 'outside of work', 'fun', 'do for fun', 'interests', 'hilig niya', 'anong ginagawa niya pag hindi busy'],
        handler: handleHobbies,
    },
    {
        name: 'pricing',
        priority: 0,
        keywords: ['freelance rate', 'pricing', 'how much do you charge', 'cost to hire', 'hourly rate', 'salary expectation', 'compensation', 'freelance project', 'magkano charge niya'],
        handler: handlePricing,
    },
    {
        name: 'laugh',
        priority: 2,
        keywords: ['haha', 'hehe', 'lol', 'lmao', 'rofl', 'hihi'],
        handler: handleLaugh,
    },
    {
        name: 'wealth',
        priority: 1,
        keywords: ['paano ako yayaman', 'yayaman', 'get rich', 'how to be rich', 'pautang', 'perang marami'],
        handler: handleWealth,
    },
    {
        name: 'chatter',
        priority: 3,
        keywords: ['ok', 'okay', 'wow', 'cool', 'nice', 'i see', 'ah', 'oh', 'astig', 'lodi', 'petmalu'],
        handler: handleChatter,
    },
    {
        name: 'summary',
        priority: 1,
        keywords: [
            'summarize', 'summary', 'recap', 'what did we talk about', 'what were we talking about', 'remind me', 
            'anong pinag usapan natin', 'paki summarize', 'anong topic natin'
        ],
        handler: handleSummary,
    },
];

// ─── Language Detection ──────────────────────────────────────

const TL_VOCABULARY = new Set([
    'kumusta', 'musta', 'saan', 'san', 'ano', 'anu', 'sino', 'cno', 'kailan', 'kelan', 'paano', 'bakit', 'bkit',
    'nasaan', 'taga', 'galing', 'salamat', 'paalam', 'ingat', 'ayos', 'ka', 'mo', 'si', 'ang', 'mga', 'ng', 'na',
    'sa', 'at', 'o', 'ba', 'kaba', 'po', 'opo', 'astig', 'lodi', 'petmalu', 'yayaman', 'pautang', 'niya', 'kanya',
    'nila', 'ewan', 'aywan', 'wala', 'dito', 'dto', 'd2', 'dyan', 'doon', 'dun', 'pala', 'naman', 'nga', 'din',
    'rin', 'talaga', 'oo', 'hindi', 'di', 'huwag', 'wag', 'kaya', 'pwede', 'pede', 'pde', 'gawa', 'gawin',
    'marunong', 'silipin', 'patingin', 'kwento', 'sabihin', 'alvaran', 'magkano', 'oras', 'bago', 'gabi', 'umaga', 'hapon'
]);

function detectLanguage(query) {
    if (!query) return 'en';
    const rawWords = query.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    const matches = rawWords.filter(w => TL_VOCABULARY.has(w));
    
    const hasTlPattern = rawWords.some(w => TL_VOCABULARY.has(w)) ||
                         (rawWords.includes('si') && rawWords.length > 1) || 
                         (rawWords.includes('taga') && rawWords.length > 1) ||
                         (rawWords.includes('saan') && rawWords.length > 1) ||
                         (rawWords.includes('san') && rawWords.length > 1);

    return (matches.length > 0 || hasTlPattern) ? 'tl' : 'en';
}

// ─── Query Normalization & Grammar/Typo Correction ───────────

const CHAT_SHORTCUTS = {
    'kaba': 'ka ba',
    'd2': 'dito',
    'dto': 'dito',
    'san': 'saan',
    'anu': 'ano',
    'anoo': 'ano',
    'anooo': 'ano',
    'cno': 'sino',
    'bkit': 'bakit',
    'kelan': 'kailan',
    'kilan': 'kailan',
    'bka': 'baka',
    'pede': 'pwede',
    'pde': 'pwede',
    'wag': 'huwag',
    'aq': 'ako',
    'ikw': 'ikaw',
    'thx': 'thanks',
    'ty': 'thank you',
    'tnx': 'thanks',
    'pls': 'please',
    'plz': 'please',
    'u': 'you',
    'ur': 'your',
    'r': 'are',
    'cge': 'sige',
    'ge': 'sige',
    'idk': 'ewan',
    'dunno': 'ewan',
};

function normalizeQuery(raw) {
    if (!raw) return '';
    let text = raw.toLowerCase();

    // 1. Collapse excessive repeated letters (e.g., "hellooo" -> "hello", "hiiii" -> "hi", "kamustaaa" -> "kamusta")
    text = text.replace(/([a-zA-Z])\1{2,}/g, '$1');

    // 2. Strip unwanted punctuation except essential apostrophes
    text = text.replace(/[^\w\s']/g, ' ');

    // 3. Expand common chat abbreviations and correct grammar shortcuts
    const tokens = text.trim().split(/\s+/).map(word => {
        return CHAT_SHORTCUTS[word] || word;
    });

    return tokens.join(' ').replace(/\s+/g, ' ').trim();
}


// ─── Memoized Levenshtein Distance ───────────────────────────

const _editCache = new Map();

function getEditDistance(a, b) {
    const cacheKey = `${a}|${b}`;
    if (_editCache.has(cacheKey)) return _editCache.get(cacheKey);

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b[i - 1] === a[j - 1]
                ? matrix[i - 1][j - 1]
                : Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j] + 1       // deletion
                );
        }
    }

    const result = matrix[b.length][a.length];
    _editCache.set(cacheKey, result);
    return result;
}

// ─── Word-Level Fuzzy Match ───────────────────────────────────

function wordMatchesQuery(word, queryWords) {
    return queryWords.some(qw => {
        if (qw === word) return true;
        // Don't do substring matches for very short words to avoid false positives (e.g., "oh" in "john")
        if (word.length > 3 && qw.length > 3 && (qw.includes(word) || word.includes(qw))) return true;
        if (word.length > 3 && qw.length > 3) {
            const dist = getEditDistance(word, qw);
            return dist <= (word.length > 5 ? 2 : 1);
        }
        return false;
    });
}

// ─── Score a Single Keyword Against a Query ──────────────────
//
// Returns a normalized score in [0, 10]:
//   10  = full exact-phrase match
//   5-7 = substring / multi-word match
//   2-4 = fuzzy word-level match
//   0   = no match

function scoreKeyword(kw, normalizedQuery, queryWords) {
    if (normalizedQuery === kw) return 10;

    const kwWords = kw.split(' ');
    
    if (kwWords.length > 1) {
        // Multi-word phrase
        if (normalizedQuery.includes(kw)) {
            const specificity = Math.min(kwWords.length, 4);
            return 5 + specificity;
        }
        
        // Try word-by-word fuzzy match
        const allMatch = kwWords.every(w => wordMatchesQuery(w, queryWords));
        if (allMatch) return 3 + kwWords.length;
    } else {
        // Single word keyword
        if (queryWords.includes(kw)) {
            return 6; // Exact single-word match
        }
        if (wordMatchesQuery(kw, queryWords)) return 2; // Fuzzy single-word match
    }

    return 0;
}

// ─── Intent Classifier ───────────────────────────────────────

function classifyIntent(query) {
    const normalizedQuery = normalizeQuery(query);
    const queryWords = normalizedQuery.split(/\s+/);

    const scored = intents.map(intent => {
        const score = intent.keywords.reduce((total, kw) => {
            return total + scoreKeyword(kw.toLowerCase(), normalizedQuery, queryWords);
        }, 0);
        return { intent, score };
    });

    const maxPossible = intents.reduce((max, intent) => {
        return Math.max(max, intent.keywords.length * 10);
    }, 1);

    const results = scored
        .filter(r => r.score >= SCORE_THRESHOLD)
        .map(r => ({
            intent: r.intent,
            score: r.score,
            confidence: r.score / maxPossible,
        }))
        .sort((a, b) => {
            if (a.intent.name === 'chatter' && b.intent.name !== 'chatter') return 1;
            if (b.intent.name === 'chatter' && a.intent.name !== 'chatter') return -1;
            if (b.score !== a.score) return b.score - a.score;
            return a.intent.priority - b.intent.priority;
        });

    return results;
}

// ─── Response Handlers ────────────────────────────────────────

function handleGreeting(query, ctx) {
    const lang = detectLanguage(query);
    
    if (lang === 'tl') {
        const tlGreetings = [
            `Kumusta! Ako si **${botIdentity.name}**, ang friendly AI wingman ni Charles. 👋 Masaya kitang makausap! Ano ang pwede kong maitulong o maibahagi tungkol sa kanya?`,
            `Uy hello! 🚀 Welcome sa portfolio ni Charles. Handang-handa akong magkwento tungkol sa mga gawa niya, tech stack, o tulungan ka sa tech questions!`,
            `Kamusta! 😊 Nandito ako para tulungan kang silipin ang mga projects, skills, o resume ni Charles. Ano ang gusto mong simulan?`
        ];
        return pickRandom(tlGreetings);
    }

    const greetings = [
        `Hey there! 👋 I'm **${botIdentity.name}**, Charles' personal AI assistant & portfolio wingman. What can we dive into today — his projects, tech stack, or background?`,
        `Hello and welcome! 🚀 I'm Charles' AI companion. Whether you're curious about his full-stack systems, engineering chops, or hiring availability, I've got you covered!`,
        `Hi! Great to connect with you. ✨ I can walk you through Charles' work, discuss tech architecture, check his resume, or answer anything tech-related. What's on your mind?`,
    ];
    return pickRandom(greetings);
}


function handleBotIdentity(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Ako si **${botIdentity.name}**, ang AI ni Charles. 🤖\n\nGinawa ako ni Charles gamit ang Google Gemini, kasama ang sarili niyang JavaScript engine bilang backup.\n\n**Kaya kong gawin:**\n- Magbigay ng impormasyon tungkol sa skills at projects ni Charles.\n- Mag-search sa web para sa Wikipedia, Reddit, at iba pa.\n- Real-time dictionary lookups.\n- Pakikipag-usap tungkol sa tech at career.`;
    }
    return `I am **${botIdentity.name}**, ${botIdentity.role}. 🤖\n\nCharles built me on Google Gemini, with his own hand-coded JavaScript engine as a backup brain.\n\n**Capabilities:**\n- Detailed insights into Charles' skills and projects.\n- Live web searching (Web, Wikipedia, Reddit).\n- Real-time dictionary lookups.\n- Technical discussion and guidance.\n\n*Try asking: "What is his tech stack?" or "Is he available for hire?"*`;
}

function handleOwnerIdentity(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        const tlBio = "Isang bagong graduate ng Information Technology na may matinding hilig sa teknolohiya at software development. Dalubhasa sa paggawa ng high-performance digital experiences gamit ang modernong web technologies at user-centric design. Sa ngayon ay bukas para sa mga bagong oportunidad at handang mag-ambag sa mga makabagong koponan.";
        return `Si **${owner.name}** ay isang dedicated na ${owner.title} na nakabase sa **${owner.location}**. 📍\n\n${tlBio}\n\n**Quick Stats:**\n- ⏱️ **Karanasan**: Mahigit ${owner.yearsExperience} taon\n- 🚀 **Projects**: Mahigit ${owner.totalProjects} apps\n- 🎓 **Edukasyon**: ${owner.education}`;
    }
    return `**${owner.name}** is a dedicated ${owner.title} based in **${owner.location}**. 📍\n\n${owner.bio}\n\n**Quick Highlights:**\n- ⏱️ **Experience**: ${owner.yearsExperience} years of development\n- 🚀 **Projects**: ${owner.totalProjects} applications developed\n- 🎓 **Education**: ${owner.education}\n- 🟢 **Status**: ${owner.status}`;
}

function handleSkills(query, ctx) {
    const lang = detectLanguage(query);
    const fe = skills.frontend.join(', ');
    const be = skills.backend.join(', ');
    const libs = skills.libraries.join(', ');
    const tools = skills.tools.join(', ');

    if (lang === 'tl') {
        return `Narito ang technical toolkit ni Charles:\n\n` +
               `🎨 **Frontend**: ${fe}\n` +
               `⚙️ **Backend**: ${be}\n` +
               `📚 **Frameworks**: ${libs}\n` +
               `🛠️ **Tools**: ${tools}\n\n` +
               `**Key Competencies:**\n` +
               `${skills.highlights.map(h => `✅ ${h}`).join('\n')}`;
    }

    return `Charles has a diverse technical toolkit designed for modern web engineering:\n\n` +
           `🎨 **Frontend**: ${fe}\n` +
           `⚙️ **Backend**: ${be}\n` +
           `📚 **Frameworks**: ${libs}\n` +
           `🛠️ **Tools**: ${tools}\n\n` +
           `**Key Competencies:**\n` +
           `${skills.highlights.map(h => `✅ ${h}`).join('\n')}`;
}

function handleSkillCheck(query, ctx) {
    const lang = detectLanguage(query);
    const normalized = normalizeQuery(query);
    const knownSkills = [
        ...skills.frontend,
        ...skills.backend,
        ...skills.libraries,
        ...skills.tools,
    ];
    const aliases = {
        'vue js': 'Vue.js',
        vuejs: 'Vue.js',
        node: 'Node.js',
        'node js': 'Node.js',
        nodejs: 'Node.js',
        ts: 'TypeScript',
        js: 'JavaScript',
        postgres: 'PostgreSQL',
        tailwind: 'Tailwind CSS',
    };
    const directMatch = knownSkills.find(skill => {
        const normalizedSkill = normalizeQuery(skill.replace(/[.]/g, ' '));
        return normalized.includes(normalizedSkill);
    });
    const alias = Object.keys(aliases).find(key => {
        const pattern = key.replace(' ', '\\s+');
        return new RegExp(`\\b${pattern}\\b`, 'i').test(normalized);
    });
    const confirmedSkill = directMatch || (alias ? aliases[alias] : null);

    if (confirmedSkill) {
        return lang === 'tl'
            ? `Oo. Nakalista ang **${confirmedSkill}** sa verified portfolio stack ni Charles.`
            : `Yes. **${confirmedSkill}** is listed in Charles' verified portfolio stack.`;
    }

    const candidateMatch = normalized.match(/(?:know|use|with|familiar with|alam|marunong(?: ba)?(?: si charles| siya)?(?: sa)?)\s+([a-z0-9+#. -]{1,40})$/i);
    const candidate = candidateMatch?.[1]?.trim().replace(/\b(?:well|yet|too)\b$/i, '').trim();
    const displayName = candidate
        ? candidate.replace(/\b\w/g, letter => letter.toUpperCase())
        : 'That technology';

    return lang === 'tl'
        ? `Hindi nakalista ang **${displayName}** sa verified portfolio stack ni Charles, kaya ayokong mag-assume. Para makumpirma, puwede siyang kontakin sa [${owner.email}](mailto:${owner.email}).`
        : `**${displayName}** is not listed in Charles' verified portfolio stack, so I can't confirm that skill without guessing. You can ask him directly at [${owner.email}](mailto:${owner.email}).`;
}

function handleHiringFit(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Magandang candidate si Charles dahil pinagsasama niya ang **full-stack development**, **UI/UX thinking**, at hands-on experience sa practical systems. Makikita sa portfolio niya ang ERP workflows, real-time apps, Firebase/Supabase projects, browser tooling, at design work. Bukas din siya sa full-time, freelance, at contract opportunities.\n\n[View Resume](#resume) o mag-email sa [${owner.email}](mailto:${owner.email}).`;
    }
    return `Charles is a strong candidate because he combines **full-stack engineering**, **UI/UX awareness**, and hands-on experience building practical systems. His portfolio shows range across ERP workflows, real-time applications, Firebase/Supabase projects, browser tooling, and product design. He is open to full-time, freelance, and contract opportunities.\n\n[View his resume](#resume) or contact him at [${owner.email}](mailto:${owner.email}).`;
}

function formatProjectLink(p) {
    return p.link ? `\n[View Project](${p.link})` : '';
}

function handleProjects(query, ctx) {
    const lang = detectLanguage(query);
    const projectList = projects.map(p =>
        `🚀 **${p.name}**\n${p.description}${formatProjectLink(p)}`
    ).join('\n\n');
    const otherList = otherProjects.map(p => `- **${p.name}** (${p.category})`).join('\n');

    if (lang === 'tl') {
        return `Nakalikha na si Charles ng mahigit **${owner.totalProjects}** na projects. Narito ang mga featured systems niya:\n\n${projectList}\n\n**Iba pang gawa:**\n${otherList}\n\n*Pwede kang magtanong ng detalye tungkol sa kahit anong project niya!*`;
    }

    return `Charles has built **${owner.totalProjects}** projects, from production-ready platforms to design work and tools. Here are his featured systems:\n\n${projectList}\n\n**Other work:**\n${otherList}\n\n*Tip: You can ask for more details about any project by name!*`;
}

function handleSpecificProject(query, ctx) {
    const lang = detectLanguage(query);
    const q = query.toLowerCase();
    const all = [...projects, ...otherProjects];
    const aliases = { extension: 'Appen Highlighter Extension', 'discord bot': 'Discord Community Bot', thesis: 'College Thesis UI/UX', figma: 'UI/UX Portfolio', countryside: 'Countryside Steakhouse', 'vibe builds': 'VibeBuilds' };
    let project = all.find(p => q.includes(p.name.toLowerCase()));
    if (!project) {
        const alias = Object.keys(aliases).find(a => q.includes(a));
        if (alias) project = all.find(p => p.name === aliases[alias]);
    }

    if (project) {
        const techStack = project.tech.join(', ');
        const highlights = project.highlights ? `\n- ✨ **Highlights**: ${project.highlights}` : '';
        const link = project.link ? `\n- 🔗 **Link**: [Visit ${project.name}](${project.link})` : '';

        if (/\b(tech|stack|built|build|architecture|framework|language|made with|use|uses)\b/i.test(q)) {
            const verifiedDetail = project.highlights
                ? ` The portfolio highlights ${project.highlights}`
                : '';
            const verifiedDetailTl = project.highlights
                ? ` Naka-highlight sa portfolio ang ${project.highlights}`
                : '';
            return lang === 'tl'
                ? `Ang verified tech stack ng **${project.name}** ay **${techStack}**.${verifiedDetailTl} Hindi nakadokumento ang mas malalim na architecture details, kaya ayokong manghula.`
                : `The verified stack for **${project.name}** is **${techStack}**.${verifiedDetail} Deeper architecture details are not documented, so I won't guess.`;
        }

        if (/\b(link|demo|site|url|visit|live)\b/i.test(q)) {
            if (!project.link) {
                return `There is no public link listed for **${project.name}** yet.`;
            }
            return lang === 'tl'
                ? `Narito ang public link ng **${project.name}**: [Buksan ang project](${project.link})`
                : `Here is the public link for **${project.name}**: [Open the project](${project.link})`;
        }

        return `**Project Spotlight: ${project.name}** 🚀\n\n${project.description}\n\n- 🛠️ **Tech Stack**: ${techStack}${highlights}${link}`;
    }
    return handleProjects(query, ctx);
}

function handleContact(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Si Charles ay **${owner.status}** at handang makipag-usap para sa mga bagong projects! 🤝\n\n**Kontakin siya dito:**\n- 📧 **Email**: [${owner.email}](mailto:${owner.email})\n- 📘 **Facebook**: [Charles Louie Alvaran](${owner.socials.facebook})\n- 📸 **Instagram**: [@natsdyyy](${owner.socials.instagram})\n\nMakikita rin ang direct contact links sa Contact section sa ibaba.`;
    }
    return `Charles is currently **${owner.status}** and eager to discuss new projects! 🤝\n\n**Reach out directly:**\n- 📧 **Email**: [${owner.email}](mailto:${owner.email})\n- 📱 **Phone**: ${owner.phone}\n- 📘 **Facebook**: [Charles Louie Alvaran](${owner.socials.facebook})\n- 📸 **Instagram**: [@natsdyyy](${owner.socials.instagram})\n\nThe Contact section below contains the same direct links.`;
}

function handleExperience(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `**Professional Background:**\n\nGumagawa si Charles ng responsive interfaces at full-stack web systems gamit ang React, Vue.js, Node.js, Supabase, Firebase, at PostgreSQL. Kasama sa portfolio niya ang ERP workflows, real-time applications, browser tooling, at UI/UX design.\n\n**Stats:**\n- 🎓 **Degree**: ${owner.education}\n- ⏱️ **Karanasan**: ${owner.yearsExperience} Taon\n- 💼 **Portfolio**: ${owner.totalProjects} Projects developed\n- 📍 **Lugar**: ${owner.location}`;
    }
    return `**Professional Background:**\n\nCharles builds responsive interfaces and full-stack web systems using React, Vue.js, Node.js, Supabase, Firebase, and PostgreSQL. His portfolio includes ERP workflows, real-time applications, browser tooling, and UI/UX design.\n\n**Core Stats:**\n- 🎓 **Degree**: ${owner.education}\n- ⏱️ **Active Years**: ${owner.yearsExperience} Years\n- 💼 **Portfolio**: ${owner.totalProjects} Projects developed\n- 📍 **Location**: ${owner.location}`;
}

function handleResume(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Maaari mong i-preview o i-download ang Resume ni Charles dito:\n\n- 📄 [**View / Download Resume**](#resume)\n\n*May mga partikular ka bang tanong tungkol sa background niya? Mag-tanong lang!*`;
    }
    return `You can preview or download Charles' full Resume/CV directly through the portfolio:\n\n- 📄 [**View / Download Resume**](#resume)\n\n*Have specific questions about his background? Just ask!*`;
}

function handleAvailability(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Magandang balita! Si Charles ay kasalukuyang **${owner.status}** 🟢.\n\nBukas siya para sa:\n\n- Full-time engineering positions (Remote o On-site)\n- Freelance web development projects\n- Contract-based software engineering\n- Collaborative ventures\n\nEmail mo lang siya sa [${owner.email}](mailto:${owner.email})!`;
    }
    return `Great news! Charles is currently **${owner.status}** 🟢.\n\nHe is actively open to discussing:\n\n- Full-time engineering positions (Remote or On-site)\n- Freelance web development projects\n- Contract-based software engineering\n- Exciting collaborative ventures\n\nReach out directly via email at [${owner.email}](mailto:${owner.email}) or through the Contact section below!`;
}

function handleLocation(query, ctx) {
    const lang = detectLanguage(query);

    if (lang === 'tl') {
        return `Si Charles ay nakabase sa **Dasmariñas City, Cavite**! 📍\n\n- 🕐 **Timezone**: GMT+8 (Philippine Standard Time)\n- 🌐 **Remote**: Handang makipagtulungan sa mga team kahit saan sa mundo.\n- 🏢 **On-Site**: Pwedeng magtrabaho sa Metro Manila at Cavite areas.\n\n*Huwag mag-atubiling mag-message kahit anong oras!*`;
    }

    return `Charles is based in **Dasmariñas City, Cavite**! 📍\n\n- 🕐 **Timezone**: GMT+8 (Philippine Standard Time)\n- 🌐 **Remote Capabilities**: Fully equipped and open to collaborating with teams worldwide\n- 🏢 **On-Site Work**: Available for opportunities within Metro Manila and the Cavite area\n\n*Feel free to reach out regardless of your timezone!*`;
}

function handleThanks(query, ctx) {
    const lang = detectLanguage(query);

    if (lang === 'tl') {
        return `Walang anuman! Masaya akong makatulong. Sabihan mo lang ako kung may kailangan ka pa! 😊`;
    }

    return pickRandom([
        "You're welcome! Let me know if there's anything else. 😊",
        "Happy to help! Feel free to explore the portfolio or ask more questions.",
        "Glad I could help! Don't hesitate to reach out anytime. 🙌",
    ]);
}

function handleGoodbye(query, ctx) {
    const lang = detectLanguage(query);

    if (lang === 'tl') {
        return `Sige, paalam! Maraming salamat sa pagbisita. Ingat ka palagi! 👋`;
    }

    return pickRandom([
        "See you later! Thanks for visiting Charles' portfolio. 👋",
        "Goodbye! If you're interested in working with Charles, hit that Contact button! 😊",
        "Take care! Come back anytime — I'm always here. ✌️",
    ]);
}

function handleHelp(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Narito ang mga pwede mong itanong:\n\n💡 **Portfolio & Karanasan**\n- *"Sino si Charles?"* o *"Ano ang tech stack niya?"*\n- *"Ipakita ang projects"* o *"Tungkol saan ang Countryside Steakhouse?"*\n- *"Available ba siya?"* o *"Paano siya kontakin?"*\n\n🔍 **Live Web Search**\n- *"Ano ang quantum computing?"*\n- *"Best React frameworks in 2025"*\n\nMag-type lang sa ibaba at susubukan kong sagutin nang maayos!`;
    }
    return `Here are a few things you can ask me:\n\n💡 **Portfolio & Experience**\n- *"Who is Charles?"* or *"What is his tech stack?"*\n- *"Show me his projects"* or *"Tell me about Countryside Steakhouse"*\n- *"Is he available for hire?"* or *"How do I contact him?"*\n\n🔍 **Live Web Search**\n- *"What is quantum computing?"*\n- *"Best React frameworks in 2025"*\n- *"Define serendipity"*\n\nJust type your question below and I'll do my best to give you a smart answer!`;
}

function handleCompliment(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Salamat! Pinaghirapan ni Charles ang paggawa sa akin at sa buong portfolio na ito. Dahil siya ay isang developer na mahilig gumawa mula sa simula. 🚀`;
    }
    return pickRandom([
        `Thanks! Charles put a lot of effort into this portfolio — and he built me from scratch too! If you're impressed, imagine what he could build for your team. 😉`,
        `Appreciate it! This entire AI system was hand-coded by Charles — no external AI SDKs. That's the kind of developer he is. 🔥`,
        `Thank you! Every part of this — the design, the chat AI, the web scrapers — was built from the ground up. Charles loves crafting things from zero to production. 🚀`,
    ]);
}

function handleJoke(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Ano ang tawag sa asong marunong mag-code? Edi... a **Byte**! 🐶💻`;
    }
    const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs. 🐛",
        "A SQL query walks into a bar, sees two tables, and asks: 'Can I join you?' 🍺",
        "Why was the JavaScript developer sad? Because he didn't Node how to Express himself. 😄",
        "How many programmers does it take to change a light bulb? None — that's a hardware problem. 💡",
        "What's a programmer's favorite hangout? Foo Bar. 🍔",
    ];
    return pickRandom(jokes);
}

function handleHobbies(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Pag hindi busy sa pag-code, malamang na nag-eexplore si Charles ng bagong tech, nag-ge-games, o nag-aaral ng makabagong trends. Lagi niyang gustong mag-improve! 🎮📚`;
    }
    return `When Charles isn't coding, he's probably exploring new tech, gaming, or learning about the latest web development trends. He's always looking for ways to improve his craft! 🎮📚`;
}

function handlePricing(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Ang rate ni Charles ay depende sa hirap at laki ng project. Pwedeng freelance, contract, o full-time role. Message mo lang siya para mapag-usapan! 💼`;
    }
    return `Charles's rates depend on the scope and complexity of the project. Whether it's a freelance gig, a contract, or a full-time role, he's open to discussion!\n\nReach out via the **Contact** page to get a quote. 💼`;
}

function handleSmallTalk(query, ctx) {
    const lang = detectLanguage(query);

    if (lang === 'tl') {
        return pickRandom([
            `Ayos na ayos ako! ⚡ Nakabantay at laging handang mag-share ng info tungkol sa projects at skills ni Charles. Ikaw, kumusta ang araw mo?`,
            `Solid naman dito sa server side! 😄 Masaya akong may kausap na katulad mo. Ano ang gusto nating pag-usapan?`,
            `Lahat ng systems ay 100% operational! 🚀 Ready to chat. Kumusta ang dev journey o work mo lately?`
        ]);
    }

    return pickRandom([
        "I'm doing fantastic, thanks for asking! ⚡ All systems are running smooth and I'm ready to chat about Charles' projects, code, or anything tech. How's your day going?",
        "Feeling great! 🚀 Ready to explore systems, break down tech stacks, or search the web. What brings you to Charles' portfolio today?",
        "Running at peak performance! 💻 Always excited to connect with developers, recruiters, and tech lovers. How can I make your visit awesome today?",
    ]);
}

function handleUncertainty(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Haha ayos lang yan! 😂 Kung di ka sigurado kung anong uunahing itanong, pwede kitang ipasyal sa mga highlight ni Charles:\n\n` +
               `- 🚀 **Countryside Steakhouse**: Isang full-featured ERP system na may finance, CRM, at inventory.\n` +
               `- 💻 **VibeBuilds**: Real-time PC builder at community platform para sa tech enthusiasts.\n` +
               `- ⚡ **Tech Stack**: Frontend (Vue, React), Backend (Node.js, Supabase, Firebase).\n` +
               `- 📄 [**View / Download Resume**](#resume)\n\n` +
               `Pili ka lang sa mga buttons sa ibaba o sabihin mo kung ano ang trip mong makita! 🚀`;
    }
    return `Haha no worries at all! 😄 If you're not sure where to start, here are some great highlights to explore:\n\n` +
           `- 🚀 **Countryside Steakhouse**: A full-scale ERP system for restaurant operations.\n` +
           `- 💻 **VibeBuilds**: Interactive PC builder platform with real-time component validation.\n` +
           `- ⚡ **Tech Stack**: Vue, React, Node.js, Express, Supabase, Tailwind.\n` +
           `- 📄 [**View / Download Resume**](#resume)\n\n` +
           `Feel free to click any of the suggestion chips below or ask me anything! 🚀`;
}

function handleLaugh(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Haha! Mukhang natutuwa ka. Ano pa ang gusto mong malaman? 😊`;
    }
    return pickRandom([
        "Haha! Glad you're having fun. Let me know if you need any serious info! 😄",
        "Lol! I may be just an AI, but I appreciate a good laugh. 🤖",
        "Hehe! What's so funny? Ask me a question if you're ready to get back to business!",
    ]);
}

function handleWealth(query, ctx) {
    return `Naku, ito lang ang sikreto: **Magtrabaho ka, magsipag ka, at mag-hustling ka** para umasenso tayo sa buhay! 💪✨\n\nTsaka nga pala... pautang naman ng 500, babayaran ko na lang sa katapusan. Salamat!`;
}

function handleChatter(query, ctx) {
    const lang = detectLanguage(query);
    
    if (lang === 'tl') {
        return "Salamat! Ginawa ako ni Charles para maging kasing 'astig' hangga't maaari. 😉";
    }

    const reactions = [
        "Got it! What else would you like to know?",
        "I see! Feel free to ask more questions about Charles' work.",
        "Cool! I'm here if you need anything else.",
        "Nice! Anything else on your mind?",
        "Interesting! What can I help you explore next?",
    ];
    return pickRandom(reactions);
}

function handleUnknownSimpleWord(query) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Medyo malabo o baka may typo yung sinabi mo tungkol sa "${query}"! 😄 Pero walang problema — andito ako para tulungan ka. Pwede nating silipin ang mga projects ni Charles tulad ng **Countryside Steakhouse** o **VibeBuilds**, ang **tech stack** niya, o ang **resume**. Pili ka lang sa suggestion buttons sa ibaba! 🚀`;
    }
    return `I didn't quite catch what you meant by "${query}"! 😄 But no worries at all — I'm right here to help you explore. We can dive into Charles' featured projects like **Countryside Steakhouse** or **VibeBuilds**, check out his **tech stack**, or open his **resume**. Feel free to tap any of the suggestion buttons! 🚀`;
}

function handleSummary(query, ctx) {
    const lang = detectLanguage(query);
    const history = ctx.history || [];
    
    // Rule 5: Use intelligent grouped summary instead of raw query list
    return generateSmartSummary(history, lang);
}

// ─── Utility ──────────────────────────────────────────────────

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Math Evaluation ──────────────────────────────────────────

function extractMathExpression(query) {
    const isMathWord = /\b(calculate|compute|solve|math|equation)\b/i.test(query);
    const exprRegex = /(?:[\d]+(?:\.\d+)?)\s*(?:[+\-*/^]|plus|minus|times|divided by)\s*(?:[\d]+(?:\.\d+)?|\()/i;
    const directRegex = /^[.\d\s+\-*/^()]+$/;

    if (isMathWord || exprRegex.test(query) || directRegex.test(query)) {
        let clean = query.toLowerCase()
            .replace(/what is|what's|calculate|compute|solve|the|value|of|math|equation|equals|equal|is/gi, '')
            .replace(/plus/gi, '+')
            .replace(/minus/gi, '-')
            .replace(/times|multiplied by/gi, '*')
            .replace(/divided by/gi, '/')
            .trim();
            
        const matches = clean.match(/[.\d\s+\-*/^()]+/g);
        if (matches) {
            const mathOnly = matches.find(m => /\d/.test(m) && /[+\-*/^]/.test(m));
            if (mathOnly) {
                return mathOnly.trim();
            }
        }
    }
    return null;
}

function evaluateMath(expr, query) {
    try {
        let jsExpr = expr.replace(/\^/g, '**');
        
        // Remove trailing/leading operators before checking
        jsExpr = jsExpr.replace(/^[+*/-]+|[+*/-]+$/g, '').trim();

        if (/[^.\d\s+\-*/()**]/.test(jsExpr)) {
            return null;
        }
        
        const result = new Function('return (' + jsExpr + ')')();
        
        if (typeof result === 'number' && !isNaN(result)) {
            const lang = detectLanguage(query);
            // Format to 4 decimal places max if it's a float
            const formattedResult = Number.isInteger(result) ? result : parseFloat(result.toFixed(4));
            
            if (lang === 'tl') {
                return `Ang sagot sa **${expr.replace(/\*\*/g, '^')}** ay **${formattedResult}**. 🧮`;
            }
            return `The answer to **${expr.replace(/\*\*/g, '^')}** is **${formattedResult}**. 🧮`;
        }
    } catch (e) {
        console.error("[localBrain] Math eval error:", e.message);
    }
    return null;
}

// ─── Sentiment Analysis ───────────────────────────────────────

function detectSentiment(query) {
    const q = query.toLowerCase();
    
    // Expanded to 8 emotional states for deeper persona intelligence
    // Priority: specific emotions match first
    
    if (/\b(angry|furious|ridiculous|stupid|idiot|dumb|trash|garbage|worst|terrible|awful|horrible|sucks|useless|waste|scam|pathetic|bobo|tanga|gago|panget|basura|walang kwenta|punyeta)\b/i.test(q)) {
        return 'angry';
    }
    
    if (/\b(sad|depressed|lonely|miss|crying|cry|heartbroken|lost|grief|mourning|pain|hurts|suffering|hopeless|helpless|malungkot|lungkot|nalulungkot|masakit|nakakalungkot)\b/i.test(q)) {
        return 'sad';
    }
    
    if (/\b(stressed|overwhelmed|pressure|deadline|burned out|burnout|exhausted|tired|drained|anxiety|anxious|panic|worried|sobrang pagod|di ko na kaya|nakakapagod|pressured)\b/i.test(q)) {
        return 'stressed';
    }
    
    if (/\b(frustrated|annoyed|ugh|come on|not working|broken|wrong|bad|doesn't work|can't|won't|fail|stuck|impossible|nakakainis|ayaw|hindi gumagana|mali|nakakabwisit|hay nako)\b/i.test(q)) {
        return 'frustrated';
    }
    
    if (/\b(confused|don't understand|what do you mean|unclear|lost|makes no sense|huh|help me understand|naguguluhan|di ko gets|ano daw|di ko maintindihan)\b/i.test(q)) {
        return 'confused';
    }
    
    if (/\b(curious|wondering|interested|tell me more|how does|what if|is it true|fascinated|intrigued|nagtataka|gusto kong malaman|interesante)\b/i.test(q)) {
        return 'curious';
    }
    
    if (/\b(thanks|thank you|appreciate|grateful|helpful|you're the best|lifesaver|saved me|perfect answer|salamat|maraming salamat|tenkyu|salamuch|naiappreciate)\b/i.test(q)) {
        return 'grateful';
    }
    
    if (/\b(excited|amazing|awesome|incredible|fantastic|love it|perfect|brilliant|genius|wow|omg|can't wait|thrilled|mind blown|sobrang galing|grabeng|ang husay|lupet|petmalu|sheesh)\b/i.test(q)) {
        return 'excited';
    }
    
    if (/\b(happy|great|good|nice|cool|love|wonderful|sweet|yay|excellent|best|masaya|maganda|ayos|saya|galing|astig|husay)\b/i.test(q)) {
        return 'happy';
    }
    
    return 'neutral';
}

// ─── Word-Level Semantic Knowledge Search ─────────────────────

function searchLocalKnowledge(query, history = []) {
    const normalized = normalizeQuery(query);
    const words = normalized.split(/\s+/);

    // 1. Specific Projects
    const projectTriggers = ['countryside', 'steakhouse', 'erp', 'vibebuilds', 'vibe', 'builds', 'dynbooth', 'photo', 'ismeye', 'altermatch', 'appen', 'extension', 'discord', 'figma'];
    if (words.some(w => projectTriggers.includes(w))) {
        return handleSpecificProject(normalized, { history });
    }

    // 2. General Projects
    const generalProjectTriggers = ['projects', 'project', 'portfolio', 'gawa', 'nagawamo', 'built', 'systems', 'system', 'apps', 'app'];
    if (words.some(w => generalProjectTriggers.includes(w))) {
        return handleProjects(normalized, { history });
    }

    // 3. Skills & Tech Stack
    const techTriggers = ['skills', 'skill', 'stack', 'tech', 'technologies', 'technology', 'react', 'vue', 'vuejs', 'node', 'nodejs', 'express', 'supabase', 'firebase', 'tailwind', 'typescript', 'javascript', 'docker', 'git', 'vite', 'fullstack', 'frontend', 'backend', 'api', 'database', 'program', 'coding'];
    if (words.some(w => techTriggers.includes(w))) {
        return handleSkills(normalized, { history });
    }

    // 4. Resume / CV
    const resumeTriggers = ['resume', 'cv', 'curriculum', 'biodata', 'download'];
    if (words.some(w => resumeTriggers.includes(w))) {
        return handleResume(normalized, { history });
    }

    // 5. Hiring / Availability
    const hiringTriggers = ['hire', 'hiring', 'available', 'job', 'freelance', 'contract', 'remote', 'work', 'collaborate', 'employment'];
    if (words.some(w => hiringTriggers.includes(w))) {
        return handleAvailability(normalized, { history });
    }

    // 6. Contact & Socials
    const contactTriggers = ['contact', 'email', 'phone', 'reach', 'social', 'facebook', 'instagram', 'message', 'call', 'kontak'];
    if (words.some(w => contactTriggers.includes(w))) {
        return handleContact(normalized, { history });
    }

    // 7. Creator / Background
    if (words.some(w => ['charles', 'developer', 'creator', 'owner'].includes(w))) {
        return handleOwnerIdentity(normalized, { history });
    }
    if (words.some(w => ['education', 'degree', 'school', 'graduate', 'experience', 'years'].includes(w))) {
        return handleExperience(normalized, { history });
    }

    // 8. Uncertainty / Casual check
    const uncertaintyTriggers = ['ewan', 'aywan', 'idk', 'dunno', 'wala', 'nevermind', 'nvm', 'nothing'];
    if (words.some(w => uncertaintyTriggers.includes(w))) {
        return handleUncertainty(normalized, { history });
    }

    // 9. Greetings
    const greetingTriggers = ['hello', 'hi', 'hey', 'sup', 'yo', 'kamusta', 'kumusta', 'musta', 'uy', 'oy'];
    if (words.some(w => greetingTriggers.includes(w))) {
        return handleGreeting(normalized, { history });
    }

    return null;
}

// ─── Main Export ──────────────────────────────────────────────

/**
 * tryLocalAnswer(query)
 *
 * Returns a string response if a local intent matched,
 * or null if the query should fall through to web search.
 */
function tryLocalAnswer(query, history = []) {
    // ─── Try Math First ──────────────────────────────────────────
    const mathMatch = extractMathExpression(query);
    if (mathMatch) {
        const mathAnswer = evaluateMath(mathMatch, query);
        if (mathAnswer) {
            console.log(`[localBrain] 🧮 Math evaluated: "${mathMatch}" -> Answered locally.`);
            return mathAnswer;
        }
    }

    const results = classifyIntent(query);

    if (results.length > 0) {
        const [top, ...others] = results;
        console.log(`[localBrain] ✅ Intent: "${top.intent.name}" | score: ${top.score} | confidence: ${top.confidence.toFixed(2)}`);
        if (others.length) {
            console.log(`[localBrain] Also matched: ${others.map(r => `${r.intent.name}(${r.score})`).join(', ')}`);
        }
        return top.intent.handler(query, { history });
    }

    // ─── Word-Level Semantic Knowledge Search ─────────────────────
    console.log(`[localBrain] Searching individual words and entities for: "${query}"`);
    const smartAnswer = searchLocalKnowledge(query, history);
    if (smartAnswer) {
        console.log(`[localBrain] 🎯 Matched via smart word & entity search!`);
        return smartAnswer;
    }

    // ─── Conversational / Short Word Fallback ─────────────────────
    const words = query.trim().split(/\s+/);
    const isSearchPattern = /^(what|who|define|meaning|where|how|search|look up)\b/i.test(query);

    if (words.length <= 4 && !isSearchPattern) {
        console.log(`[localBrain] 🧠 Conversational / typo query handled: "${query}"`);
        return handleUnknownSimpleWord(query);
    }

    console.log(`[localBrain] Query: "${query}" — will search the web.`);
    return null;
}

module.exports = { tryLocalAnswer, classifyIntent, normalizeQuery, detectLanguage, detectSentiment };
