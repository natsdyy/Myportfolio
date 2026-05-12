/**
 * Knowledge Base (From Scratch)
 * This is the "memory" of the local AI. No API needed.
 * All data about Charles is stored here for instant answers.
 */

const owner = {
    name: "Charles Louie Alvaran",
    nickname: "Charles",
    title: "IT Graduate & Full-Stack Developer",
    location: "Dasmariñas, Cavite, Philippines",
    email: "charleslouiealvaran@gmail.com",
    status: "Open for Work",
    education: "BS Information Technology",
    socials: {
        facebook: "https://www.facebook.com/CharlesLouieAlvaran/",
        instagram: "https://www.instagram.com/natsdyyy/",
    },
    bio: "A recent Information Technology graduate with a strong passion for technology and software development. Specializes in building high-performance digital experiences with modern web technologies and user-centric design. Currently open for opportunities and eager to contribute to innovative teams.",
    yearsExperience: "3+",
    totalProjects: "20+",
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
    ],
};

const projects = [
    {
        name: "Countryside Steakhouse",
        description: "A comprehensive ERP system featuring specialized modules for finance, inventory, CRM, payroll, branches, POS, job hiring, and more.",
        tech: ["ERP", "Management", "Business"],
        link: "https://www.countryside-steakhouse.site/",
        highlights: "Finance, Inventory, CRM, Payroll, Branches, POS, Job Hiring.",
    },
    {
        name: "VibeBuilds",
        description: "A high-performance PC configuration platform and community hub for tech enthusiasts, featuring real-time component validation.",
        tech: ["React TS", "Node.js", "Libraries"],
        link: "https://www.vibebuilds.site",
        highlights: "Real-time component compatibility checker, community-driven platform.",
    },
    {
        name: "Dynbooth",
        description: "Dynamic digital photo booth ecosystem with cloud-based asset management and real-time social sharing capabilities.",
        tech: ["React TS", "Node.js", "Firebase"],
        link: "https://dynbooth.vercel.app",
        highlights: "Cloud asset management, real-time photo sharing, event-ready solution.",
    },
    {
        name: "Ismeye",
        description: "Innovative visual identity and social networking platform designed for seamless personal branding and professional networking.",
        tech: ["React TS", "Node.js", "Firebase"],
        link: "https://www.ismeye.site",
        highlights: "Personal branding tools, professional networking features.",
    },
    {
        name: "Altermatch",
        description: "Advanced competitive matching engine utilizing real-time data synchronization for high-fidelity user interactions.",
        tech: ["React TS", "Supabase", "Turbo"],
        link: "https://altermatch.vercel.app",
        highlights: "Real-time matching algorithm, high-performance data sync.",
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

module.exports = { owner, skills, projects, botIdentity };
