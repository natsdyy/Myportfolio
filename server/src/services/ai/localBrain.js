/**
 * Local Brain v2 (From Scratch — No API Needed)
 * 
 * A custom intent classifier with fuzzy matching.
 * Handles portfolio questions, small talk, and conversational patterns.
 * 
 * 100% custom JavaScript — no LangChain, no OpenAI SDK.
 */

const { owner, skills, projects, botIdentity } = require('../../data/knowledgeBase');

// ─── Intent Definitions ───────────────────────────────────────
const intents = [
    {
        name: 'greeting',
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'whats up', "what's up", 'howdy', 'greetings', 'hola'],
        handler: handleGreeting,
    },
    {
        name: 'bot_identity',
        keywords: ['who are you', 'what are you', 'your name', 'what can you do', 'what do you do', 'capabilities', 'introduce yourself', 'tell me about yourself', 'are you ai', 'are you a bot', 'are you real'],
        handler: handleBotIdentity,
    },
    {
        name: 'owner_identity',
        keywords: ['who is charles', 'who made you', 'who built you', 'who created you', 'about charles', 'tell me about charles', 'who is the developer', 'who is the owner', 'your creator', 'your developer', 'charles louie', 'about him', 'who is he'],
        handler: handleOwnerIdentity,
    },
    {
        name: 'skills_tech',
        keywords: ['skills', 'tech stack', 'technologies', 'programming', 'languages', 'frameworks', 'what does he know', 'what can he do', 'frontend', 'backend', 'tools', 'expertise', 'proficient', 'stack', 'coding'],
        handler: handleSkills,
    },
    {
        name: 'projects',
        keywords: ['projects', 'portfolio', 'work', 'built', 'created', 'developed', 'apps', 'websites', 'applications', 'show me his work'],
        handler: handleProjects,
    },
    {
        name: 'specific_project',
        keywords: ['rentopia', 'vibebuilds', 'vibe builds', 'dynbooth', 'ismeye', 'altermatch'],
        handler: handleSpecificProject,
    },
    {
        name: 'contact',
        keywords: ['contact', 'email', 'reach', 'hire', 'connect', 'get in touch', 'message him', 'social media', 'facebook', 'instagram', 'how to contact'],
        handler: handleContact,
    },
    {
        name: 'experience',
        keywords: ['experience', 'years', 'how long', 'career', 'background', 'education', 'degree', 'graduate', 'school', 'university', 'qualification', 'resume', 'cv'],
        handler: handleExperience,
    },
    {
        name: 'availability',
        keywords: ['available', 'hiring', 'open for work', 'freelance', 'job', 'work with', 'collaborate', 'open to', 'looking for work', 'employment'],
        handler: handleAvailability,
    },
    {
        name: 'location',
        keywords: ['where is he', 'location', 'based', 'where does he live', 'country', 'city', 'philippines', 'cavite', 'timezone'],
        handler: handleLocation,
    },
    {
        name: 'thanks',
        keywords: ['thanks', 'thank you', 'appreciate', 'helpful', 'awesome', 'nice work', 'cool', 'good job', 'amazing', 'wonderful', 'great job'],
        handler: handleThanks,
    },
    {
        name: 'goodbye',
        keywords: ['bye', 'goodbye', 'see you', 'later', 'take care', 'gtg', 'gotta go', 'cya', 'peace', 'im out'],
        handler: handleGoodbye,
    },
    {
        name: 'help',
        keywords: ['help', 'how to use', 'what can i ask', 'commands', 'features', 'menu', 'options'],
        handler: handleHelp,
    },
    {
        name: 'compliment',
        keywords: ['smart', 'impressive', 'wow', 'cool portfolio', 'nice website', 'beautiful', 'well done', 'talented', 'genius', 'brilliant'],
        handler: handleCompliment,
    },
    {
        name: 'joke',
        keywords: ['joke', 'funny', 'make me laugh', 'humor', 'tell me a joke', 'something funny'],
        handler: handleJoke,
    },
];

// ─── Fuzzy Intent Classifier ─────────────────────────────────
function classifyIntent(query) {
    const normalizedQuery = query.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    for (const intent of intents) {
        let score = 0;
        for (const keyword of intent.keywords) {
            const kw = keyword.toLowerCase();
            
            // Exact phrase match (highest score)
            if (normalizedQuery.includes(kw)) {
                score += kw.length * 2;
                continue;
            }

            // Fuzzy: check if all words of the keyword exist in query
            const kwWords = kw.split(' ');
            const queryWords = normalizedQuery.split(/\s+/);
            const allWordsMatch = kwWords.every(w => 
                queryWords.some(qw => qw.includes(w) || w.includes(qw))
            );
            if (allWordsMatch && kwWords.length > 1) {
                score += kw.length;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = intent;
        }
    }

    // Require minimum score (avoids false positives)
    return bestScore >= 3 ? bestMatch : null;
}

// ─── Response Handlers ────────────────────────────────────────

function handleGreeting() {
    const greetings = [
        `Hey there! 👋 I'm ${botIdentity.name}, Charles' AI assistant. Ask me about his projects, skills, or anything else — I can even search the web for you!`,
        `Hello! Welcome to Charles' portfolio. I know his tech stack, projects, and background inside-out. What would you like to know?`,
        `Hi! I'm here to help. I can answer questions about Charles, look up definitions, search Reddit, Wikipedia, and more. Fire away! 🚀`,
    ];
    return pickRandom(greetings);
}

function handleBotIdentity() {
    return `I'm **${botIdentity.name}** — ${botIdentity.role}. 🤖\n\nI was built **entirely from scratch** using custom JavaScript — no external AI libraries!\n\nHere's what I can do:\n• Answer questions about Charles' skills, projects & experience\n• Search **Google, Wikipedia, and Reddit** for live info\n• Look up **word definitions** from a dictionary API\n• Have conversations about tech topics\n\nTry asking: *"What is machine learning?"* or *"Define eloquent"* or *"Tell me about Rentopia"*`;
}

function handleOwnerIdentity() {
    return `**${owner.name}** is a ${owner.title} based in ${owner.location}.\n\n${owner.bio}\n\n📊 **Quick Stats:**\n• ${owner.yearsExperience} years of experience\n• ${owner.totalProjects} projects completed\n• Education: ${owner.education}\n• Status: 🟢 ${owner.status}`;
}

function handleSkills() {
    const fe = skills.frontend.join(', ');
    const be = skills.backend.join(', ');
    const libs = skills.libraries.join(', ');
    const tools = skills.tools.join(', ');

    return `Here's Charles' full tech stack:\n\n🎨 **Frontend:** ${fe}\n⚙️ **Backend:** ${be}\n📚 **Libraries:** ${libs}\n🛠️ **Tools:** ${tools}\n\n**Key Strengths:**\n${skills.highlights.map(h => `• ${h}`).join('\n')}`;
}

function handleProjects() {
    const projectList = projects.map((p, i) => 
        `**${i + 1}. ${p.name}** — ${p.description}\n   🔗 ${p.link}`
    ).join('\n\n');

    return `Charles has built **${owner.totalProjects}** projects. Here are his featured ones:\n\n${projectList}\n\nWant details on a specific project? Just ask by name!`;
}

function handleSpecificProject(query) {
    const q = query.toLowerCase();
    const project = projects.find(p => q.includes(p.name.toLowerCase()));
    
    if (project) {
        const techStack = project.tech.join(', ');
        return `**${project.name}** 🚀\n\n${project.description}\n\n🛠️ **Tech Stack:** ${techStack}\n✨ **Highlights:** ${project.highlights}\n🔗 **Live:** ${project.link}`;
    }
    return handleProjects();
}

function handleContact() {
    return `You can reach Charles through:\n\n📧 **Email:** ${owner.email}\n📘 **Facebook:** ${owner.socials.facebook}\n📸 **Instagram:** ${owner.socials.instagram}\n\nOr use the **Contact** section on this portfolio. He's currently **${owner.status}** and would love to hear from you! 🤝`;
}

function handleExperience() {
    return `**${owner.name}**\n\n🎓 **Education:** ${owner.education}\n⏱️ **Experience:** ${owner.yearsExperience} years of hands-on development\n💼 **Projects Completed:** ${owner.totalProjects}\n📍 **Location:** ${owner.location}\n\nHe's worked across the full stack — from responsive UIs to real-time backends — building everything from real estate platforms to competitive matching engines.`;
}

function handleAvailability() {
    return `Great news! Charles is currently **${owner.status}** 🟢\n\nHe's open to:\n• Full-time positions (remote or on-site)\n• Freelance projects\n• Contract work\n• Collaborative opportunities\n\nReach out at **${owner.email}** or use the Contact section!`;
}

function handleLocation() {
    return `Charles is based in **${owner.location}** 📍\n\n🕐 Timezone: GMT+8 (Philippine Standard Time)\n🌐 Open to remote work worldwide\n🏢 Also open to on-site in Metro Manila & Cavite area`;
}

function handleThanks() {
    return pickRandom([
        "You're welcome! Let me know if there's anything else. 😊",
        "Happy to help! Feel free to explore the portfolio or ask more questions.",
        "Glad I could help! Don't hesitate to reach out anytime. 🙌",
    ]);
}

function handleGoodbye() {
    return pickRandom([
        "See you later! Thanks for visiting Charles' portfolio. 👋",
        "Goodbye! If you're interested in working with Charles, hit that Contact button! 😊",
        "Take care! Come back anytime — I'm always here. ✌️",
    ]);
}

function handleHelp() {
    return `Here's what you can ask me:\n\n💡 **About Charles:**\n• "Who is Charles?" / "What's his tech stack?"\n• "Show me his projects" / "Tell me about Rentopia"\n• "Is he available for hire?" / "How to contact him?"\n\n🔍 **Web Search:**\n• "What is quantum computing?" (Wikipedia + Google)\n• "Best React frameworks 2024" (Reddit + Google)\n• "Define serendipity" (Dictionary)\n• "Latest tech news" (Google)\n\n💬 **Chat:**\n• Say hi, ask for a joke, or just have a conversation!`;
}

function handleCompliment() {
    return pickRandom([
        `Thanks! Charles put a lot of effort into this portfolio — and he built me from scratch too! If you're impressed, imagine what he could build for your team. 😉`,
        `Appreciate it! This entire AI system was hand-coded by Charles — no external AI SDKs. That's the kind of developer he is. 🔥`,
        `Thank you! Every part of this — the design, the chat AI, the web scrapers — was built from the ground up. Charles loves crafting things from zero to production. 🚀`,
    ]);
}

function handleJoke() {
    const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs. 🐛",
        "A SQL query walks into a bar, sees two tables, and asks: 'Can I join you?' 🍺",
        "Why was the JavaScript developer sad? Because he didn't Node how to Express himself. 😄",
        "How many programmers does it take to change a light bulb? None — that's a hardware problem. 💡",
        "What's a programmer's favorite hangout? Foo Bar. 🍔",
    ];
    return pickRandom(jokes);
}

// ─── Utility ──────────────────────────────────────────────────
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main Export ──────────────────────────────────────────────
function tryLocalAnswer(query) {
    const intent = classifyIntent(query);
    
    if (!intent) {
        console.log('[localBrain] No intent matched — will search the web.');
        return null;
    }

    console.log(`[localBrain] ✅ Intent matched: "${intent.name}"`);
    return intent.handler(query);
}

module.exports = { tryLocalAnswer, classifyIntent };
