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

// ─── Constants ────────────────────────────────────────────────

const SCORE_THRESHOLD = 4;
const CONFIDENCE_THRESHOLD = 0.25; // ratio of best score to max possible

// ─── Intent Definitions ───────────────────────────────────────
// priority: lower number = wins tiebreaks (use when intents share keywords)

const intents = [
    {
        name: 'greeting',
        priority: 1,
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'howdy', 'greetings', 'hola'],
        handler: handleGreeting,
    },
    {
        name: 'small_talk',
        priority: 2,
        keywords: ['how are you', 'hows it going', 'how do you do', 'whats up', 'what\'s up', 'how\'s it going'],
        handler: handleSmallTalk,
    },
    {
        name: 'bot_identity',
        priority: 1,
        keywords: ['who are you', 'what are you', 'your name', 'what can you do', 'what do you do', 'capabilities', 'introduce yourself', 'tell me about yourself', 'are you ai', 'are you a bot', 'are you real'],
        handler: handleBotIdentity,
    },
    {
        name: 'owner_identity',
        priority: 1,
        keywords: ['who is charles', 'who made you', 'who built you', 'who created you', 'about charles', 'tell me about charles', 'who is the developer', 'who is the owner', 'your creator', 'your developer', 'charles louie', 'about him', 'who is he'],
        handler: handleOwnerIdentity,
    },
    {
        name: 'skills_tech',
        priority: 1,
        keywords: ['skills', 'tech stack', 'technologies', 'programming', 'languages', 'frameworks', 'what does he know', 'what can he do', 'frontend', 'backend', 'tools', 'expertise', 'proficient', 'stack', 'coding'],
        handler: handleSkills,
    },
    {
        name: 'projects',
        priority: 1,
        keywords: ['projects', 'portfolio', 'work', 'built', 'created', 'developed', 'apps', 'websites', 'applications', 'show me his work'],
        handler: handleProjects,
    },
    {
        name: 'specific_project',
        priority: 0, // highest — very specific signals
        keywords: ['rentopia', 'vibebuilds', 'vibe builds', 'dynbooth', 'ismeye', 'altermatch'],
        handler: handleSpecificProject,
    },
    {
        name: 'contact',
        priority: 1,
        keywords: ['contact', 'email', 'reach', 'hire', 'connect', 'get in touch', 'message him', 'social media', 'facebook', 'instagram', 'how to contact'],
        handler: handleContact,
    },
    {
        name: 'experience',
        priority: 1,
        keywords: ['experience', 'years', 'how long', 'career', 'background', 'education', 'degree', 'graduate', 'school', 'university', 'qualification'],
        handler: handleExperience,
    },
    {
        name: 'resume',
        priority: 0,
        keywords: ['resume', 'cv', 'curriculum vitae', 'download resume', 'view resume'],
        handler: handleResume,
    },
    {
        name: 'availability',
        priority: 1,
        keywords: ['available', 'hiring', 'open for work', 'freelance', 'job', 'work with', 'collaborate', 'open to', 'looking for work', 'employment'],
        handler: handleAvailability,
    },
    {
        name: 'location',
        priority: 1,
        keywords: ['where are you from', 'where are you', 'where do you live', 'where is he', 'location', 'based', 'where does he live', 'country', 'city', 'philippines', 'cavite', 'timezone'],
        handler: handleLocation,
    },
    {
        name: 'thanks',
        priority: 2,
        keywords: ['thanks', 'thank you', 'appreciate', 'helpful', 'awesome', 'nice work', 'cool', 'good job', 'amazing', 'wonderful', 'great job'],
        handler: handleThanks,
    },
    {
        name: 'goodbye',
        priority: 1,
        keywords: ['bye', 'goodbye', 'see you', 'later', 'take care', 'gtg', 'gotta go', 'cya', 'peace', 'im out'],
        handler: handleGoodbye,
    },
    {
        name: 'help',
        priority: 1,
        keywords: ['help', 'how to use', 'what can i ask', 'commands', 'features', 'menu', 'options'],
        handler: handleHelp,
    },
    {
        name: 'compliment',
        priority: 2,
        keywords: ['smart', 'impressive', 'wow', 'cool portfolio', 'nice website', 'beautiful', 'well done', 'talented', 'genius', 'brilliant'],
        handler: handleCompliment,
    },
    {
        name: 'joke',
        priority: 1,
        keywords: ['joke', 'funny', 'make me laugh', 'humor', 'tell me a joke', 'something funny'],
        handler: handleJoke,
    },
    {
        name: 'hobbies',
        priority: 1,
        keywords: ['hobbies', 'free time', 'outside of work', 'fun', 'do for fun', 'interests'],
        handler: handleHobbies,
    },
    {
        name: 'pricing',
        priority: 0,
        keywords: ['freelance rate', 'pricing', 'how much do you charge', 'cost to hire', 'hourly rate', 'salary expectation', 'compensation', 'freelance project'],
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
];

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
        if (qw.length > 3 && (qw.includes(word) || word.includes(qw))) return true;
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
    // Full exact match (highest confidence)
    if (normalizedQuery === kw) return 10;

    // Substring match — prefer longer, more specific keywords
    if (normalizedQuery.includes(kw)) {
        const specificity = Math.min(kw.split(' ').length, 4); // 1-4 bonus for phrase length
        return 5 + specificity;
    }

    // Multi-word fuzzy: all words of keyword must match somewhere in query
    const kwWords = kw.split(' ');
    if (kwWords.length > 1) {
        const allMatch = kwWords.every(w => wordMatchesQuery(w, queryWords));
        if (allMatch) return 3 + kwWords.length; // longer phrase = more confident
    } else {
        // Single word fuzzy
        if (wordMatchesQuery(kw, queryWords)) return 2;
    }

    return 0;
}

// ─── Intent Classifier ───────────────────────────────────────
//
// Returns array of { intent, score, confidence } sorted by score desc.
// Empty array = no match.

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
            return a.intent.priority - b.intent.priority; // lower priority number wins
        });

    return results;
}

// ─── Response Handlers ────────────────────────────────────────
// All handlers receive (query, ctx) for future extensibility.

function handleGreeting(query, ctx) {
    const greetings = [
        `Hey! I'm **${botIdentity.name}**, Charles' personal AI assistant. 👋 I'm here to help you explore his work, skills, and experience. What can I help you find today?`,
        `Hello! Welcome to Charles' portfolio. 🚀 I have full access to his project history and technical background. How can I assist you?`,
        `Hi there! I'm Charles' AI. I can answer questions about his tech stack, provide his resume, or even search the web for you. What's on your mind?`,
    ];
    return pickRandom(greetings);
}

function handleBotIdentity(query, ctx) {
    return `I am **${botIdentity.name}**, ${botIdentity.role}. 🤖\n\nI was built **entirely from scratch** using a custom JavaScript engine — no external AI libraries like OpenAI or LangChain required.\n\n**Capabilities:**\n- Detailed insights into Charles' skills and projects.\n- Live web searching (Web, Wikipedia, Reddit).\n- Real-time dictionary lookups.\n- Technical discussion and guidance.\n\n*Try asking: "What is his tech stack?" or "How much is a PS5?"*`;
}

function handleOwnerIdentity(query, ctx) {
    return `**${owner.name}** is a dedicated ${owner.title} based in **${owner.location}**. 📍\n\n${owner.bio}\n\n**Quick Highlights:**\n- ⏱️ **Experience**: ${owner.yearsExperience} years of development\n- 🚀 **Projects**: ${owner.totalProjects} applications developed\n- 🎓 **Education**: ${owner.education}\n- 🟢 **Status**: ${owner.status}`;
}

function handleSkills(query, ctx) {
    const fe = skills.frontend.join(', ');
    const be = skills.backend.join(', ');
    const libs = skills.libraries.join(', ');
    const tools = skills.tools.join(', ');

    return `Charles has a diverse technical toolkit designed for modern web engineering:\n\n` +
           `🎨 **Frontend**: ${fe}\n` +
           `⚙️ **Backend**: ${be}\n` +
           `📚 **Frameworks**: ${libs}\n` +
           `🛠️ **Tools**: ${tools}\n\n` +
           `**Key Competencies:**\n` +
           `${skills.highlights.map(h => `✅ ${h}`).join('\n')}`;
}

function handleProjects(query, ctx) {
    const projectList = projects.map(p =>
        `🚀 **${p.name}**\n${p.description}\n[View Project](${p.link})`
    ).join('\n\n');

    return `Charles has developed over **${owner.totalProjects}** applications, ranging from production-ready platforms to complex experimental systems. Here are some of his featured works:\n\n${projectList}\n\n*Tip: You can ask for more details about any project by name!*`;
}

function handleSpecificProject(query, ctx) {
    const q = query.toLowerCase();
    const project = projects.find(p => q.includes(p.name.toLowerCase()));

    if (project) {
        const techStack = project.tech.join(', ');
        return `**Project Spotlight: ${project.name}** 🚀\n\n${project.description}\n\n- 🛠️ **Tech Stack**: ${techStack}\n- ✨ **Key Highlights**: ${project.highlights}\n- 🔗 **Live Demo**: [Visit ${project.name}](${project.link})`;
    }
    return handleProjects(query, ctx);
}

function handleContact(query, ctx) {
    return `Charles is currently **${owner.status}** and eager to discuss new projects! 🤝\n\n**Reach out directly:**\n- 📧 **Email**: [${owner.email}](mailto:${owner.email})\n- 📘 **Facebook**: [Charles Louie Alvaran](${owner.socials.facebook})\n- 📸 **Instagram**: [@natsdyyy](${owner.socials.instagram})\n\nYou can also use the contact form at the bottom of the page to send a direct message!`;
}

function handleExperience(query, ctx) {
    return `**Professional Background:**\n\nCharles specializes in building responsive user interfaces and high-performance backend systems. His expertise ranges from scalable real estate platforms to real-time competitive matching engines.\n\n**Core Stats:**\n- 🎓 **Degree**: ${owner.education}\n- ⏱️ **Active Years**: ${owner.yearsExperience} Years\n- 💼 **Portfolio**: ${owner.totalProjects} Projects developed\n- 📍 **Location**: ${owner.location}`;
}

function handleResume(query, ctx) {
    return `You can preview or download Charles' full Resume/CV directly through the portfolio:\n\n- 📄 [**View / Download Resume**](#resume)\n\n*Have specific questions about his background? Just ask!*`;
}

function handleAvailability(query, ctx) {
    return `Great news! Charles is currently **${owner.status}** 🟢.\n\nHe is actively open to discussing:\n\n- Full-time engineering positions (Remote or On-site)\n- Freelance web development projects\n- Contract-based software engineering\n- Exciting collaborative ventures\n\nReach out directly via email at [${owner.email}](mailto:${owner.email}) or through the Contact section below!`;
}

function handleLocation(query, ctx) {
    return `Charles is based in **Dasmariñas City, Cavite**! 📍\n\n- 🕐 **Timezone**: GMT+8 (Philippine Standard Time)\n- 🌐 **Remote Capabilities**: Fully equipped and open to collaborating with teams worldwide\n- 🏢 **On-Site Work**: Available for opportunities within Metro Manila and the Cavite area\n\n*Feel free to reach out regardless of your timezone!*`;
}

function handleThanks(query, ctx) {
    return pickRandom([
        "You're welcome! Let me know if there's anything else. 😊",
        "Happy to help! Feel free to explore the portfolio or ask more questions.",
        "Glad I could help! Don't hesitate to reach out anytime. 🙌",
    ]);
}

function handleGoodbye(query, ctx) {
    return pickRandom([
        "See you later! Thanks for visiting Charles' portfolio. 👋",
        "Goodbye! If you're interested in working with Charles, hit that Contact button! 😊",
        "Take care! Come back anytime — I'm always here. ✌️",
    ]);
}

function handleHelp(query, ctx) {
    return `Here are a few things you can ask me:\n\n💡 **Portfolio & Experience**\n- *"Who is Charles?"* or *"What is his tech stack?"*\n- *"Show me his projects"* or *"Tell me about Rentopia"*\n- *"Is he available for hire?"* or *"How do I contact him?"*\n\n🔍 **Live Web Search**\n- *"What is quantum computing?"*\n- *"Best React frameworks in 2025"*\n- *"Define serendipity"*\n\nJust type your question below and I'll do my best to give you a smart answer!`;
}

function handleCompliment(query, ctx) {
    return pickRandom([
        `Thanks! Charles put a lot of effort into this portfolio — and he built me from scratch too! If you're impressed, imagine what he could build for your team. 😉`,
        `Appreciate it! This entire AI system was hand-coded by Charles — no external AI SDKs. That's the kind of developer he is. 🔥`,
        `Thank you! Every part of this — the design, the chat AI, the web scrapers — was built from the ground up. Charles loves crafting things from zero to production. 🚀`,
    ]);
}

function handleJoke(query, ctx) {
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
    return `When Charles isn't coding, he's probably exploring new tech, gaming, or learning about the latest web development trends. He's always looking for ways to improve his craft! 🎮📚`;
}

function handlePricing(query, ctx) {
    return `Charles's rates depend on the scope and complexity of the project. Whether it's a freelance gig, a contract, or a full-time role, he's open to discussion!\n\nReach out via the **Contact** page to get a quote. 💼`;
}

function handleSmallTalk(query, ctx) {
    return pickRandom([
        "I'm doing great, thanks for asking! Just hanging out in the server, processing data. How can I help you? 🤖",
        "All systems go! Ready to answer your questions or search the web. What's on your mind?",
        "I'm just a bunch of code, so I don't have feelings — but if I did, I'd say I'm feeling fantastic! 🚀",
    ]);
}

function handleLaugh(query, ctx) {
    return pickRandom([
        "Haha! Glad you're having fun. Let me know if you need any serious info! 😄",
        "Lol! I may be just an AI, but I appreciate a good laugh. 🤖",
        "Hehe! What's so funny? Ask me a question if you're ready to get back to business!",
    ]);
}

function handleWealth(query, ctx) {
    return `Naku, ito lang ang sikreto: **Magtrabaho ka, magsipag ka, at mag-hustling ka** para umasenso tayo sa buhay! 💪✨\n\nTsaka nga pala... pautang naman ng 500, babayaran ko na lang sa katapusan. Salamat!`;
}

// ─── Utility ──────────────────────────────────────────────────

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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
function tryLocalAnswer(query) {
    const results = classifyIntent(query);

    if (!results.length) {
        console.log('[localBrain] No intent matched — will search the web.');
        console.log(`[localBrain] Query: "${query}"`);
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
    const responses = topResults.map(r => r.intent.handler(query, {}));

    return responses.length > 1
        ? responses.join('\n\n---\n\n')
        : responses[0];
}

module.exports = { tryLocalAnswer, classifyIntent, normalizeQuery };