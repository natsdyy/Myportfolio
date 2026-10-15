/**
 * Knowledge Base — single source of truth about Charles.
 *
 * Used by:
 *  - ai/systemPrompt.js       → grounds the Gemini LLM
 *  - ai/fallback/localBrain.js → rule-based fallback answers
 *
 * Keep this in sync with the portfolio sections in src/components/sections.
 */

const owner = {
    name: "Charles Louie Alvaran",
    nickname: "Charles",
    title: "IT Graduate & Full-Stack Developer",
    location: "Dasmariñas, Cavite, Philippines",
    timezone: "GMT+8 (Philippine Standard Time)",
    email: "charleslouiealvaran@gmail.com",
    phone: "+63 929 856 8415",
    status: "Open for Work",
    education: "BS Information Technology",
    socials: {
        facebook: "https://www.facebook.com/CharlesLouieAlvaran/",
        instagram: "https://www.instagram.com/natsdyyy/",
    },
    bio: "An Information Technology graduate passionate about building useful digital solutions. He enjoys turning ideas into practical websites and applications, using modern technology and AI to work smarter and solve real-world problems. Always eager to learn, improve his skills, and create solutions that make a meaningful difference.",
    yearsExperience: "2+",
    totalProjects: "10+",
    workPreferences: [
        "Full-time roles (remote or on-site in Metro Manila / Cavite)",
        "Freelance web development",
        "Contract-based software engineering",
        "Collaborative ventures",
    ],
    interests: "Exploring new tech, gaming, and keeping up with web development trends.",
};

const skills = {
    frontend: ["React", "Vue.js", "HTML", "CSS", "JavaScript", "TypeScript", "Tailwind CSS"],
    backend: ["Node.js", "Express", "Supabase", "Firebase", "PostgreSQL"],
    libraries: ["ReactBits", "shadcn/ui", "daisyUI"],
    tools: ["Figma", "Git", "Docker", "Vite"],
    highlights: [
        "Full-Stack Web Development",
        "User Interface & Experience Design",
        "Real-time Applications (WebSockets)",
        "Database Architecture",
        "API Design & Integration",
        "Responsive & Mobile-First Design",
        "AI-assisted development workflows",
    ],
};

// Featured web systems (shown under "Systems" on the portfolio)
const projects = [
    {
        name: "Countryside Steakhouse",
        category: "System",
        description: "A comprehensive ERP system featuring specialized modules for finance, inventory, CRM, payroll, branches, POS, job hiring, and more.",
        tech: ["ERP", "Management", "Business"],
        link: "https://www.countryside-steakhouse.site/",
        highlights: "Finance, Inventory, CRM, Payroll, Branches, POS, Job Hiring.",
    },
    {
        name: "VibeBuilds",
        category: "System",
        description: "A high-performance PC configuration platform and community hub for tech enthusiasts, featuring real-time component validation.",
        tech: ["React TS", "Node.js"],
        link: "https://www.vibebuilds.site",
        highlights: "Real-time component compatibility checker, community-driven platform.",
    },
    {
        name: "Dynbooth",
        category: "System",
        description: "Dynamic digital photo booth ecosystem with cloud-based asset management and real-time social sharing capabilities.",
        tech: ["React TS", "Node.js", "Firebase"],
        link: "https://dynbooth.vercel.app",
        highlights: "Cloud asset management, real-time photo sharing, event-ready solution.",
    },
    {
        name: "Ismeye",
        category: "System",
        description: "Innovative visual identity and social networking platform designed for seamless personal branding and professional networking.",
        tech: ["React TS", "Node.js", "Firebase"],
        link: "https://www.ismeye.site",
        highlights: "Personal branding tools, professional networking features.",
    },
    {
        name: "Altermatch",
        category: "System",
        description: "Advanced competitive matching engine utilizing real-time data synchronization for high-fidelity user interactions.",
        tech: ["React TS", "Supabase", "Turbo"],
        link: "https://altermatch.vercel.app",
        highlights: "Real-time matching algorithm, high-performance data sync.",
    },
];

// Other work (Figma designs, browser extensions, bots)
const otherProjects = [
    {
        name: "UI/UX Portfolio",
        category: "Figma Design",
        description: "A collection of user interface designs and UX workflows crafted in Figma, focusing on clean aesthetics and intuitive navigation.",
        tech: ["Figma", "UI/UX"],
        link: "https://www.figma.com/design/LtyIcirwyuXlYhBPF64nKh/Projects",
    },
    {
        name: "College Thesis UI/UX",
        category: "Figma Design",
        description: "System design and prototyping for a capstone thesis project, visualizing complex data flows and user interactions.",
        tech: ["Figma", "Prototyping"],
        link: "https://www.figma.com/design/D8OJ09fuTDQPXC8AUDFdaR/THESIS",
    },
    {
        name: "Appen Highlighter Extension",
        category: "Browser Extension",
        description: "A custom Chrome extension that helps coworkers identify products and get guided task instructions directly within the platform, streamlining workflows.",
        tech: ["Chrome Extension", "JavaScript", "DOM API"],
        link: "https://appenhighlighter.vercel.app/",
    },
    {
        name: "Discord Community Bot",
        category: "Bot",
        description: "A multi-purpose Discord bot for server management, featuring interactive mini-games and automated utility tools.",
        tech: ["Discord.js", "Node.js"],
        link: null,
    },
];

const botIdentity = {
    name: "CLA Assistant",
    role: "Charles Louie Alvaran's personal AI assistant",
    capabilities: [
        "Answer questions about Charles' background, skills, and projects",
        "Provide details about his tech stack and experience",
        "Help potential employers or clients learn about his work",
        "Search the web for live information when needed",
        "Discuss technology topics and trends",
    ],
    personality: "Professional, friendly, and tech-savvy. Concise but thorough.",
};

module.exports = { owner, skills, projects, otherProjects, botIdentity };
