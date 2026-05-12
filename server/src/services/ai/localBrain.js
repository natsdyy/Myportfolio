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

const { owner, skills, projects, botIdentity } = require('../../data/knowledgeBase');
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
        keywords: ['countryside steakhouse', 'vibebuilds', 'vibe builds', 'dynbooth', 'ismeye', 'altermatch'],
        handler: handleSpecificProject,
    },
    {
        name: 'contact',
        priority: 1,
        keywords: [
            'contact', 'email', 'reach', 'hire', 'connect', 'get in touch', 'message him', 'social media', 'facebook', 'instagram', 'how to contact',
            'paano siya kontakin', 'email niya', 'paano siya imessage', 'kontak', 'hire natin siya'
        ],
        handler: handleContact,
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

function detectLanguage(query) {
    const tlWords = [
        'kumusta', 'musta', 'saan', 'ano', 'sino', 'kailan', 'paano', 'bakit', 
        'nasaan', 'taga', 'galing', 'salamat', 'paalam', 'ingat', 'ayos', 'ka', 
        'mo', 'si', 'ang', 'mga', 'ng', 'na', 'sa', 'at', 'o', 'ba', 'po', 'opo',
        'astig', 'lodi', 'petmalu', 'yayaman', 'pautang', 'niya', 'kanya', 'nila'
    ];
    
    const words = query.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    
    const matches = words.filter(w => tlWords.includes(w));
    
    const hasTlPattern = (words.includes('si') && words.length > 1) || 
                         (words.includes('taga') && words.length > 1) ||
                         (words.includes('saan') && words.length > 1);

    return (matches.length > 0 || hasTlPattern) ? 'tl' : 'en';
}

// ─── Query Normalization ──────────────────────────────────────

function normalizeQuery(raw) {
    return raw
        .toLowerCase()
        .replace(/[^\w\s']/g, '') // strip punctuation except apostrophes
        .replace(/\s+/g, ' ')     // collapse whitespace
        .trim();
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
            if (b.score !== a.score) return b.score - a.score;
            return a.intent.priority - b.intent.priority;
        });

    return results;
}

// ─── Response Handlers ────────────────────────────────────────

function handleGreeting(query, ctx) {
    const lang = detectLanguage(query);
    
    if (lang === 'tl') {
        return `Kumusta! Ako ang AI ni Charles. 👋 Masaya akong makita ka dito! Ano ang maipaglilingkod ko?`;
    }

    const greetings = [
        `Hey! I'm **${botIdentity.name}**, Charles' personal AI assistant. 👋 I'm here to help you explore his work, skills, and experience. What can I help you find today?`,
        `Hello! Welcome to Charles' portfolio. 🚀 I have full access to his project history and technical background. How can I assist you?`,
        `Hi there! I'm Charles' AI. I can answer questions about his tech stack, provide his resume, or even search the web for you. What's on your mind?`,
    ];
    return pickRandom(greetings);
}

function handleBotIdentity(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Ako si **${botIdentity.name}**, ang AI ni Charles. 🤖\n\nGinaawa ako ni Charles mula sa simula gamit ang custom JavaScript engine — walang gamit na external AI SDKs.\n\n**Kaya kong gawin:**\n- Magbigay ng impormasyon tungkol sa skills at projects ni Charles.\n- Mag-search sa web para sa Wikipedia, Reddit, at iba pa.\n- Real-time dictionary lookups.\n- Pakikipag-usap tungkol sa tech at career.`;
    }
    return `I am **${botIdentity.name}**, ${botIdentity.role}. 🤖\n\nI was built **entirely from scratch** using a custom JavaScript engine — no external AI libraries like OpenAI or LangChain required.\n\n**Capabilities:**\n- Detailed insights into Charles' skills and projects.\n- Live web searching (Web, Wikipedia, Reddit).\n- Real-time dictionary lookups.\n- Technical discussion and guidance.\n\n*Try asking: "What is his tech stack?" or "How much is a PS5?"*`;
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

function handleProjects(query, ctx) {
    const lang = detectLanguage(query);
    const projectList = projects.map(p =>
        `🚀 **${p.name}**\n${p.description}\n[View Project](${p.link})`
    ).join('\n\n');

    if (lang === 'tl') {
        return `Nakalikha na si Charles ng mahigit **${owner.totalProjects}** na applications, mula sa production platforms hanggang sa experimental systems. Narito ang ilan sa kanyang mga gawa:\n\n${projectList}\n\n*Pwede kang magtanong ng detalye tungkol sa kahit anong project niya!*`;
    }

    return `Charles has developed over **${owner.totalProjects}** applications, ranging from production-ready platforms to complex experimental systems. Here are some of his featured works:\n\n${projectList}\n\n*Tip: You can ask for more details about any project by name!*`;
}

function handleSpecificProject(query, ctx) {
    const lang = detectLanguage(query);
    const q = query.toLowerCase();
    const project = projects.find(p => q.includes(p.name.toLowerCase()));

    if (project) {
        const techStack = project.tech.join(', ');
        if (lang === 'tl') {
             return `**Project Spotlight: ${project.name}** 🚀\n\n${project.description}\n\n- 🛠️ **Tech Stack**: ${techStack}\n- ✨ **Highlights**: ${project.highlights}\n- 🔗 **Live Demo**: [Visit ${project.name}](${project.link})`;
        }
        return `**Project Spotlight: ${project.name}** 🚀\n\n${project.description}\n\n- 🛠️ **Tech Stack**: ${techStack}\n- ✨ **Key Highlights**: ${project.highlights}\n- 🔗 **Live Demo**: [Visit ${project.name}](${project.link})`;
    }
    return handleProjects(query, ctx);
}

function handleContact(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `Si Charles ay **${owner.status}** at handang makipag-usap para sa mga bagong projects! 🤝\n\n**Kontakin siya dito:**\n- 📧 **Email**: [${owner.email}](mailto:${owner.email})\n- 📘 **Facebook**: [Charles Louie Alvaran](${owner.socials.facebook})\n- 📸 **Instagram**: [@natsdyyy](${owner.socials.instagram})\n\nPwede ka ring gumamit ng contact form sa ibaba para sa direct message!`;
    }
    return `Charles is currently **${owner.status}** and eager to discuss new projects! 🤝\n\n**Reach out directly:**\n- 📧 **Email**: [${owner.email}](mailto:${owner.email})\n- 📘 **Facebook**: [Charles Louie Alvaran](${owner.socials.facebook})\n- 📸 **Instagram**: [@natsdyyy](${owner.socials.instagram})\n\nYou can also use the contact form at the bottom of the page to send a direct message!`;
}

function handleExperience(query, ctx) {
    const lang = detectLanguage(query);
    if (lang === 'tl') {
        return `**Professional Background:**\n\nDalubhasa si Charles sa pagbuo ng responsive user interfaces at high-performance backend systems. Mula sa real estate platforms hanggang sa competitive matching engines.\n\n**Stats:**\n- 🎓 **Degree**: ${owner.education}\n- ⏱️ **Karanasan**: ${owner.yearsExperience} Taon\n- 💼 **Portfolio**: ${owner.totalProjects} Projects developed\n- 📍 **Lugar**: ${owner.location}`;
    }
    return `**Professional Background:**\n\nCharles specializes in building responsive user interfaces and high-performance backend systems. His expertise ranges from scalable real estate platforms to real-time competitive matching engines.\n\n**Core Stats:**\n- 🎓 **Degree**: ${owner.education}\n- ⏱️ **Active Years**: ${owner.yearsExperience} Years\n- 💼 **Portfolio**: ${owner.totalProjects} Projects developed\n- 📍 **Location**: ${owner.location}`;
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
        return `Ayos naman ako! Kasalukuyang nag-aabang ng iyong mga katanungan. Ikaw, kumusta ang araw mo? 🚀`;
    }

    return pickRandom([
        "I'm doing great, thanks for asking! Just hanging out in the server, processing data. How can I help you? 🤖",
        "All systems go! Ready to answer your questions or search the web. What's on your mind?",
        "I'm just a bunch of code, so I don't have feelings — but if I did, I'd say I'm feeling fantastic! 🚀",
    ]);
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
    // Rule 7: Ask clarifying questions instead of guessing
    if (lang === 'tl') {
        return `Hindi ako sigurado kung ano ang ibig mong sabihin sa "${query}" — tungkol ba ito kay Charles, isang tech topic, o ibang bagay? Paki-clarify lang para matulungan kita nang maayos! 😊`;
    }
    return `I want to make sure I help you correctly — when you say "${query}", are you asking about Charles' work, a tech topic, or something else entirely? Just a quick clarification and I'll get you the best answer! 😊`;
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

// ─── Main Export ──────────────────────────────────────────────

/**
 * tryLocalAnswer(query)
 *
 * Returns a string response if a local intent matched,
 * or null if the query should fall through to web search.
 *
 * For compound queries (e.g. "skills and projects"), combines
 * all matched intents above threshold into a single response.
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

    if (!results.length) {
        console.log('[localBrain] No intent matched.');
        
        // Smart Fallback: If it's a very short query (1-2 words), don't just search the web.
        // Acknowledge it as a word the AI is still learning, UNLESS it looks like a definition/knowledge request.
        const words = query.trim().split(/\s+/);
        const isSearchPattern = /^(what|who|define|meaning|where|how|search|look up)\b/i.test(query);

        if (words.length <= 2 && !isSearchPattern) {
            console.log(`[localBrain] 🧠 Short unknown query detected: "${query}"`);
            return handleUnknownSimpleWord(query);
        }

        console.log(`[localBrain] Query: "${query}" — will search the web.`);
        return null;
    }

    // Log top match and any near-misses for ongoing keyword tuning
    const [top, ...others] = results;
    console.log(`[localBrain] ✅ Intent: "${top.intent.name}" | score: ${top.score} | confidence: ${top.confidence.toFixed(2)}`);
    if (others.length) {
        console.log(`[localBrain] Also matched: ${others.map(r => `${r.intent.name}(${r.score})`).join(', ')}`);
    }

    // For compound queries, join up to 2 responses
    const topResults = results.slice(0, 2);
    const responses = topResults.map(r => r.intent.handler(query, { history }));

    return responses.length > 1
        ? responses.join('\n\n---\n\n')
        : responses[0];
}

module.exports = { tryLocalAnswer, classifyIntent, normalizeQuery, detectLanguage, detectSentiment };