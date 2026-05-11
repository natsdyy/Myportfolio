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
        keywords: ['experience', 'years', 'how long', 'career', 'background', 'education', 'degree', 'graduate', 'school', 'university', 'qualification'],
        handler: handleExperience,
    },
    {
        name: 'resume',
        keywords: ['resume', 'cv', 'curriculum vitae', 'download resume', 'view resume'],
        handler: handleResume,
    },
    {
        name: 'availability',
        keywords: ['available', 'hiring', 'open for work', 'freelance', 'job', 'work with', 'collaborate', 'open to', 'looking for work', 'employment'],
        handler: handleAvailability,
    },
    {
        name: 'location',
        keywords: ['where are you from', 'where are you', 'where do you live', 'where is he', 'location', 'based', 'where does he live', 'country', 'city', 'philippines', 'cavite', 'timezone'],
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
    {
        name: 'hobbies',
        keywords: ['hobbies', 'free time', 'outside of work', 'fun', 'do for fun', 'interests'],
        handler: handleHobbies,
    },
    {
        name: 'pricing',
        keywords: ['freelance rate', 'pricing', 'how much do you charge', 'cost to hire', 'hourly rate', 'salary expectation', 'compensation', 'freelance project'],
        handler: handlePricing,
    },
    {
        name: 'small_talk',
        keywords: ['how are you', 'hows it going', 'how do you do', 'whats up'],
        handler: handleSmallTalk,
    },
    {
        name: 'laugh',
        keywords: ['haha', 'hehe', 'lol', 'lmao', 'rofl', 'hihi'],
        handler: handleLaugh,
    },
    {
        name: 'wealth',
        keywords: ['paano ako yayaman', 'yayaman', 'get rich', 'how to be rich', 'pautang', 'perang marami'],
        handler: handleWealth,
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

            // Fuzzy: check if all words of the keyword exist in query (with typo support)
            const kwWords = kw.split(' ');
            const queryWords = normalizedQuery.split(/\s+/);
            
            const allWordsMatch = kwWords.every(w => 
                queryWords.some(qw => {
                    // Exact match
                    if (qw === w) return true;
                    // Substring match (e.g. project vs projects)
                    if (qw.length > 3 && (qw.includes(w) || w.includes(qw))) return true;
                    // True Typo match (Levenshtein distance)
                    if (w.length > 3 && qw.length > 3) {
                        const distance = getEditDistance(w, qw);
                        // Allow 1 typo for words 4-5 chars, 2 typos for 6+ chars
                        return distance <= (w.length > 5 ? 2 : 1);
                    }
                    return false;
                })
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
        `Hey! I'm **${botIdentity.name}**, Charles' personal AI assistant. 👋 I'm here to help you explore his work, skills, and experience. What can I help you find today?`,
        `Hello! Welcome to Charles' portfolio. 🚀 I have full access to his project history and technical background. How can I assist you?`,
        `Hi there! I'm Charles' AI. I can answer questions about his tech stack, provide his resume, or even search the web for you. What's on your mind?`,
    ];
    return pickRandom(greetings);
}

function handleBotIdentity() {
    return `I am **${botIdentity.name}**, ${botIdentity.role}. 🤖\n\nI was built **entirely from scratch** using a custom JavaScript engine—no external AI libraries like OpenAI or LangChain required.\n\n**Capabilities:**\n- Detailed insights into Charles' skills and projects.\n- Live web searching (Web, Wikipedia, Reddit).\n- Real-time dictionary lookups.\n- Technical discussion and guidance.\n\n*Try asking: "What is his tech stack?" or "How much is a PS5?"*`;
}

function handleOwnerIdentity() {
    return `**${owner.name}** is a dedicated ${owner.title} based in **${owner.location}**. 📍\n\n${owner.bio}\n\n**Quick Highlights:**\n- ⏱️ **Experience**: ${owner.yearsExperience} years of development\n- 🚀 **Projects**: ${owner.totalProjects} applications developed\n- 🎓 **Education**: ${owner.education}\n- 🟢 **Status**: ${owner.status}`;
}

function handleSkills() {
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

function handleProjects() {
    const projectList = projects.map((p, i) => 
        `🚀 **${p.name}**\n${p.description}\n[View Project](${p.link})`
    ).join('\n\n');

    return `Charles has developed over **${owner.totalProjects}** applications, ranging from production-ready platforms to complex experimental systems. Here are some of his featured works:\n\n${projectList}\n\n*Tip: You can ask for more details about any project by name!*`;
}

function handleSpecificProject(query) {
    const q = query.toLowerCase();
    const project = projects.find(p => q.includes(p.name.toLowerCase()));
    
    if (project) {
        const techStack = project.tech.join(', ');
        return `**Project Spotlight: ${project.name}** 🚀\n\n${project.description}\n\n- 🛠️ **Tech Stack Built With**: ${techStack}\n- ✨ **Key Highlights**: ${project.highlights}\n- 🔗 **Live Demo**: [Visit ${project.name}](${project.link})`;
    }
    return handleProjects();
}

function handleContact() {
    return `Charles is currently **${owner.status}** and eager to discuss new projects! 🤝\n\n**Reach out directly:**\n- 📧 **Email**: [${owner.email}](mailto:${owner.email})\n- 📘 **Facebook**: [Charles Louie Alvaran](${owner.socials.facebook})\n- 📸 **Instagram**: [@natsdyyy](${owner.socials.instagram})\n\nYou can also use the contact form at the bottom of the page to send a direct message!`;
}

function handleExperience() {
    return `**Professional Background:**\n\nCharles specializes in building responsive user interfaces and high-performance backend systems. His expertise ranges from scalable real estate platforms to real-time competitive matching engines.\n\n**Core Stats:**\n- 🎓 **Degree**: ${owner.education}\n- ⏱️ **Active Years**: ${owner.yearsExperience} Years\n- 💼 **Portfolio**: ${owner.totalProjects} Projects developed\n- 📍 **Location**: ${owner.location}`;
}

function handleResume() {
    return `You can preview or download my full Resume/CV directly through the portfolio! Click the link below to open it:\n\n- 📄 [**View / Download Resume**](#resume)\n\n*If you have any specific questions about my experience or background, feel free to ask!*`;
}

function handleAvailability() {
    return `Great news! Charles is currently **${owner.status}** 🟢.\n\nHe is actively open to discussing:\n\n- Full-time engineering positions (Remote or On-site)\n- Freelance web development projects\n- Contract-based software engineering\n- Exciting collaborative ventures\n\nYou can reach out directly via email at [${owner.email}](mailto:${owner.email}) or through the Contact section below!`;
}

function handleLocation() {
    return `I am from **Dasmariñas City, Cavite**! 📍\n\nHere are a few details regarding my location and availability:\n\n- 🕐 **Timezone**: GMT+8 (Philippine Standard Time)\n- 🌐 **Remote Capabilities**: Fully equipped and open to collaborating with teams worldwide\n- 🏢 **On-Site Work**: Available for opportunities within Metro Manila and the Cavite area\n\n*Feel free to reach out through the Contact page regardless of your timezone!*`;
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

function handleWealth() {
   return `Naku, ito lang ang sikreto: **Magtrabaho ka, magsipag ka, at mag-hustling ka** para umasenso tayo sa buhay! 💪✨\n\nTsaka nga pala... pautang naman ng 500, babayaran ko na lang sa katapusan. Salamat!`;
}

function handleHelp() {
    return `I am here to help you navigate Charles' portfolio and search the web. Here are a few things you can ask me:\n\n💡 **Portfolio & Experience**\n- *"Who is Charles?"* or *"What is his tech stack?"*\n- *"Show me his projects"* or *"Tell me about Rentopia"*\n- *"Is he available for hire?"* or *"How do I contact him?"*\n\n🔍 **Live Web Search**\n- *"What is quantum computing?"* (Searches Wikipedia & Google)\n- *"Best React frameworks in 2024"* (Searches Reddit)\n- *"Define serendipity"* (Searches Dictionary API)\n\nJust type your question below and I'll do my best to give you a smart answer!`;
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

function handleHobbies() {
    return `When Charles isn't coding, he's probably exploring new tech, gaming, or learning about the latest web development trends. He's always looking for ways to improve his craft! 🎮📚`;
}

function handlePricing() {
    return `Charles's rates depend on the scope and complexity of the project. Whether it's a freelance gig, a contract, or a full-time role, he's open to discussion!\n\nReach out to him via the **Contact** page to get a quote. 💼`;
}

function handleSmallTalk() {
    return pickRandom([
        "I'm doing great, thanks for asking! Just hanging out in the server, processing data. How can I help you? 🤖",
        "All systems go! Ready to answer your questions or search the web. What's on your mind?",
        "I'm just a bunch of code, so I don't have feelings, but if I did, I'd say I'm feeling fantastic! 🚀"
    ]);
}

function handleLaugh() {
    return pickRandom([
        "Haha! Glad you're having fun. Let me know if you need any serious info! 😄",
        "Lol! I may be just an AI, but I appreciate a good laugh. 🤖",
        "Hehe! What's so funny? Ask me a question if you're ready to get back to business!"
    ]);
}

// ─── Utility ──────────────────────────────────────────────────
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Levenshtein Distance for typo detection
function getEditDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
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
