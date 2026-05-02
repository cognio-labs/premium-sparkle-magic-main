import { useEffect, useState } from "react";

export type App = {
  id: string;
  name: string;
  tags: string[];
  prompt?: string;
  preview?: string;
  files?: Record<string, string>;
  messages?: { role: "user" | "assistant"; content: string; createdAt: number }[];
  createdAt: number;
  updatedAt: number;
  iconGradient?: string;
};

const APPS_KEY = "lov.apps";
const FAVS_KEY = "lov.favorites";
const TOKENS_KEY = "lov.tokens";
const DAILY_TOKENS = 20;

const seed: App[] = [
  { id: "spacetech-1", name: "SpaceTech Consulting", tags: ["consulting", "space"], createdAt: Date.now() - 86400000, updatedAt: Date.now() - 7200000, iconGradient: "from-slate-700 to-slate-900" },
  { id: "untitled-1", name: "untitled", tags: [], createdAt: Date.now() - 43200000, updatedAt: Date.now() - 3600000, iconGradient: "from-orange-200 to-orange-400" },
  { id: "spacetech-2", name: "SpaceTech Consulting", tags: ["website"], createdAt: Date.now() - 172800000, updatedAt: Date.now() - 10800000, iconGradient: "from-slate-600 to-slate-800" },
  { id: "ai-suite", name: "AI Marketing Suite", tags: ["ai", "marketing"], createdAt: Date.now() - 259200000, updatedAt: Date.now() - 14400000, iconGradient: "from-amber-300 to-rose-400" },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ---- Apps store ----
const appsListeners = new Set<() => void>();
const favsListeners = new Set<() => void>();

function emit(set: Set<() => void>) { set.forEach(fn => fn()); }

export function getApps(): App[] {
  const stored = read<App[] | null>(APPS_KEY, null);
  if (!stored) {
    localStorage.setItem(APPS_KEY, JSON.stringify(seed));
    return seed;
  }
  return stored;
}

export function saveApps(apps: App[]) {
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  emit(appsListeners);
}

export function upsertApp(app: App) {
  const apps = getApps();
  const idx = apps.findIndex(a => a.id === app.id);
  if (idx >= 0) apps[idx] = app;
  else apps.unshift(app);
  saveApps(apps);
}

export function createAppFromPrompt(prompt: string) {
  const now = Date.now();
  const name = titleFromPrompt(prompt);
  const app: App = {
    id: `app-${now}`,
    name,
    tags: ["website", "ai"],
    prompt,
    ...generateProjectFiles(prompt, name),
    messages: [
      { role: "user", content: prompt, createdAt: now },
      { role: "assistant", content: "Website draft ready. You can edit it with chat, preview it, inspect files, and download the code.", createdAt: now + 1 },
    ],
    createdAt: now,
    updatedAt: now,
    iconGradient: "from-orange-200 to-orange-500",
  };
  upsertApp(app);
  return app;
}

export function getApp(id: string): App | undefined {
  return getApps().find(a => a.id === id);
}

export function useApps() {
  const [apps, setApps] = useState<App[]>(() => getApps());
  useEffect(() => {
    const fn = () => setApps(getApps());
    appsListeners.add(fn);
    return () => { appsListeners.delete(fn); };
  }, []);
  return apps;
}

// ---- Favorites ----
export function getFavorites(): string[] {
  return read<string[]>(FAVS_KEY, []);
}

export function toggleFavorite(id: string) {
  const favs = getFavorites();
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
  localStorage.setItem(FAVS_KEY, JSON.stringify(next));
  emit(favsListeners);
}

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>(() => getFavorites());
  useEffect(() => {
    const fn = () => setFavs(getFavorites());
    favsListeners.add(fn);
    return () => { favsListeners.delete(fn); };
  }, []);
  return favs;
}

// ---- API endpoint ----
const ENDPOINT_KEY = "lov.apiEndpoint";

export function getEndpoint(): string {
  return localStorage.getItem(ENDPOINT_KEY) || "";
}
export function setEndpoint(url: string) {
  localStorage.setItem(ENDPOINT_KEY, url);
}

// ---- Daily AI tokens ----
export function getTokenState() {
  const today = new Date().toISOString().slice(0, 10);
  const state = read<{ date: string; remaining: number } | null>(TOKENS_KEY, null);
  if (!state || state.date !== today) {
    const fresh = { date: today, remaining: DAILY_TOKENS };
    localStorage.setItem(TOKENS_KEY, JSON.stringify(fresh));
    return fresh;
  }
  return state;
}

export function consumeToken(count = 1) {
  const state = getTokenState();
  if (state.remaining < count) return false;
  localStorage.setItem(TOKENS_KEY, JSON.stringify({ ...state, remaining: state.remaining - count }));
  return true;
}

export function generateProjectFiles(prompt: string, name = titleFromPrompt(prompt)) {
  const safeName = escapeHtml(name);
  const content = inferSiteContent(prompt, name);
  const accent = content.accent;
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeName}</title>
    <style>
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #101828; background: #f7f9fc; }
      a { color: inherit; text-decoration: none; }
      .nav { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 18px 7vw; background: rgba(255,255,255,.9); border-bottom: 1px solid #e5e7eb; backdrop-filter: blur(14px); }
      .brand { font-weight: 800; letter-spacing: .02em; color: #0f172a; }
      .links { display: flex; align-items: center; gap: 18px; font-size: 14px; color: #475467; }
      .nav-cta, .btn { border: 0; border-radius: 10px; padding: 12px 16px; font-weight: 700; background: ${accent}; color: white; cursor: pointer; }
      .hero { min-height: 88vh; display: grid; grid-template-columns: minmax(0,1.05fr) minmax(320px,.95fr); gap: 48px; align-items: center; padding: 82px 7vw 64px; background: linear-gradient(135deg, #ffffff 0%, #eef7ff 48%, #dbeafe 100%); }
      .eyebrow { width: fit-content; border: 1px solid rgba(0,0,0,.08); border-radius: 999px; padding: 8px 12px; font-size: 13px; font-weight: 700; color: ${accent}; background: rgba(255,255,255,.72); }
      h1 { margin: 18px 0 0; font-size: clamp(42px, 6vw, 82px); line-height: .96; letter-spacing: 0; color: #0f172a; }
      .lead { margin: 22px 0 0; max-width: 660px; font-size: 19px; line-height: 1.7; color: #475467; }
      .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
      .btn.secondary { background: white; color: #0f172a; border: 1px solid #d0d5dd; }
      .visual { min-height: 470px; border-radius: 24px; overflow: hidden; background: linear-gradient(145deg, #111827, ${accent}); box-shadow: 0 34px 90px rgba(15,23,42,.22); position: relative; }
      .visual::before { content: ""; position: absolute; inset: 28px; border-radius: 18px; border: 1px solid rgba(255,255,255,.22); background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.05)); }
      .visual-card { position: absolute; left: 34px; right: 34px; bottom: 34px; border-radius: 18px; background: rgba(255,255,255,.92); padding: 24px; box-shadow: 0 22px 60px rgba(0,0,0,.18); }
      .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
      .metric { border-radius: 14px; background: #f8fafc; padding: 14px; }
      .metric strong { display: block; font-size: 22px; color: #0f172a; }
      section { padding: 76px 7vw; }
      .section-head { max-width: 760px; margin-bottom: 34px; }
      .section-head h2 { margin: 0; font-size: clamp(30px, 4vw, 48px); line-height: 1.05; color: #0f172a; }
      .section-head p { margin: 14px 0 0; color: #667085; font-size: 17px; line-height: 1.7; }
      .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
      .card { border: 1px solid #e5e7eb; border-radius: 18px; background: white; padding: 24px; box-shadow: 0 12px 34px rgba(15,23,42,.06); transition: transform .2s ease, box-shadow .2s ease; }
      .card:hover { transform: translateY(-4px); box-shadow: 0 18px 42px rgba(15,23,42,.1); }
      .card h3 { margin: 0; font-size: 20px; color: ${accent}; }
      .card p { color: #667085; line-height: 1.65; }
      .split { display: grid; grid-template-columns: .9fr 1.1fr; gap: 42px; align-items: start; background: #0f172a; color: white; }
      .split h2 { color: white; }
      .split p, .split li { color: #cbd5e1; }
      .steps { display: grid; gap: 14px; }
      .step { border: 1px solid rgba(255,255,255,.12); border-radius: 16px; padding: 18px; background: rgba(255,255,255,.06); }
      .contact { display: grid; grid-template-columns: .9fr 1.1fr; gap: 34px; background: #f8fafc; }
      form { display: grid; gap: 14px; border: 1px solid #e5e7eb; border-radius: 20px; background: white; padding: 24px; box-shadow: 0 18px 48px rgba(15,23,42,.08); }
      input, textarea { width: 100%; border: 1px solid #d0d5dd; border-radius: 10px; padding: 13px 14px; font: inherit; }
      textarea { min-height: 120px; resize: vertical; }
      footer { padding: 28px 7vw; display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; background: #0b1220; color: #cbd5e1; }
      @media (max-width: 920px) { .hero, .split, .contact { grid-template-columns: 1fr; } .cards { grid-template-columns: 1fr; } .links { display: none; } .visual { min-height: 360px; } .metric-grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <nav class="nav">
      <a class="brand" href="#">${safeName}</a>
      <div class="links">
        <a href="#services">Services</a>
        <a href="#approach">Approach</a>
        <a href="#contact">Contact</a>
      </div>
      <a class="nav-cta" href="#contact">Book a call</a>
    </nav>
    <main>
      <section class="hero">
        <div>
          <div class="eyebrow">${content.eyebrow}</div>
          <h1>${content.heading}</h1>
          <p class="lead">${content.lead}</p>
          <div class="actions">
            <a class="btn" href="#contact">Start a project</a>
            <a class="btn secondary" href="#services">View services</a>
          </div>
        </div>
        <div class="visual" aria-label="Professional website visual">
          <div class="visual-card">
            <strong>${content.visualTitle}</strong>
            <p>${content.visualText}</p>
            <div class="metric-grid">
              <div class="metric"><strong>${content.metrics[0].value}</strong><span>${content.metrics[0].label}</span></div>
              <div class="metric"><strong>${content.metrics[1].value}</strong><span>${content.metrics[1].label}</span></div>
              <div class="metric"><strong>${content.metrics[2].value}</strong><span>${content.metrics[2].label}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="services">
        <div class="section-head">
          <h2>${content.servicesTitle}</h2>
          <p>${content.servicesIntro}</p>
        </div>
        <div class="cards">
          ${content.services.map(service => `<article class="card"><h3>${service.title}</h3><p>${service.text}</p></article>`).join("")}
        </div>
      </section>

      <section id="approach" class="split">
        <div class="section-head">
          <h2>${content.approachTitle}</h2>
          <p>${content.approachIntro}</p>
        </div>
        <div class="steps">
          ${content.steps.map((step, index) => `<div class="step"><strong>0${index + 1}. ${step.title}</strong><p>${step.text}</p></div>`).join("")}
        </div>
      </section>

      <section id="contact" class="contact">
        <div class="section-head">
          <h2>Let's build the next move</h2>
          <p>Share your goals and the team will respond with a focused plan, timeline, and recommended next steps.</p>
        </div>
        <form>
          <input aria-label="Full name" placeholder="Full name" required />
          <input aria-label="Email address" type="email" placeholder="Email address" required />
          <input aria-label="Company" placeholder="Company" />
          <textarea aria-label="Message" placeholder="Tell us what you want to achieve" required></textarea>
          <button class="btn" type="button">Send message</button>
        </form>
      </section>
    </main>
    <footer>
      <strong>${safeName}</strong>
      <span>Copyright ${new Date().getFullYear()} - Strategy, execution, and measurable outcomes.</span>
    </footer>
  </body>
</html>`;

  return {
    preview: html,
    files: {
      "package.json": JSON.stringify({
        scripts: { dev: "vite", build: "vite build" },
        dependencies: { "@vitejs/plugin-react": "latest", vite: "latest", react: "latest", "react-dom": "latest", "@supabase/supabase-js": "latest" },
        devDependencies: { typescript: "latest", tailwindcss: "latest" },
      }, null, 2),
      "src/App.tsx": `export default function App() {\n  return <main className="min-h-screen">${name}</main>;\n}\n`,
      "src/styles.css": "body { margin: 0; font-family: Inter, system-ui, sans-serif; }\n",
      "index.html": html,
      "README.md": `# ${name}\n\nPrompt:\n${prompt}\n\nStack: React, TypeScript, Node.js, Supabase, Tailwind CSS.\n`,
    },
  };
}

function inferSiteContent(prompt: string, name: string) {
  const lower = prompt.toLowerCase();
  const isConsulting = lower.includes("consult") || lower.includes("agency") || lower.includes("strategy");
  const isFinance = lower.includes("finance") || lower.includes("stock") || lower.includes("investment");
  const isSaas = lower.includes("saas") || lower.includes("software") || lower.includes("dashboard");
  const accent = isFinance ? "#2563eb" : isConsulting ? "#00a7c8" : isSaas ? "#4f46e5" : "#111827";
  const safeName = escapeHtml(name);

  if (isConsulting) {
    return {
      accent,
      eyebrow: "Consulting agency website",
      heading: `${safeName} for growth, operations, and transformation`,
      lead: "A polished consulting presence built to explain expertise clearly, convert serious leads, and give prospects a confident path from first visit to booked call.",
      visualTitle: "Advisory dashboard",
      visualText: "Strategy, execution, and measurable improvement tracked in one clear engagement model.",
      metrics: [
        { value: "6", label: "Core services" },
        { value: "3x", label: "Faster decisions" },
        { value: "90d", label: "Execution cycles" },
      ],
      servicesTitle: "Services designed for decisive teams",
      servicesIntro: "Each service is framed around business outcomes, clear ownership, and practical execution.",
      services: [
        { title: "Strategy Consulting", text: "Define priorities, market position, and a practical roadmap for the next stage of growth." },
        { title: "Digital Transformation", text: "Modernize workflows, systems, and operating rhythm without disrupting daily execution." },
        { title: "Operations Optimization", text: "Remove process friction, clarify ownership, and improve throughput across teams." },
        { title: "Change Management", text: "Support adoption with communication plans, stakeholder alignment, and measurable milestones." },
        { title: "Market Analysis", text: "Turn market signals, competitors, and customer needs into confident strategic choices." },
        { title: "Training & Development", text: "Build team capability with focused workshops, playbooks, and leadership enablement." },
      ],
      approachTitle: "A practical approach from diagnosis to delivery",
      approachIntro: "The process keeps strategy grounded in the current business reality and converts recommendations into action.",
      steps: [
        { title: "Discover", text: "Map goals, constraints, stakeholders, and the real causes behind current blockers." },
        { title: "Design", text: "Create the operating plan, service roadmap, and measurable success criteria." },
        { title: "Deliver", text: "Execute in focused cycles with weekly visibility, decisions, and next actions." },
      ],
    };
  }

  if (isFinance) {
    return {
      accent,
      eyebrow: "Finance platform",
      heading: `${safeName} for smarter financial decisions`,
      lead: "A responsive website for presenting investment services, portfolio insights, and trusted advisory workflows with clarity.",
      visualTitle: "Portfolio overview",
      visualText: "Client holdings, risk profile, and performance signals presented for quick review.",
      metrics: [
        { value: "24/7", label: "Visibility" },
        { value: "100%", label: "Tracked" },
        { value: "3", label: "Risk levels" },
      ],
      servicesTitle: "Financial services with clear reporting",
      servicesIntro: "Help clients understand what is happening, why it matters, and what to do next.",
      services: [
        { title: "Portfolio Planning", text: "Build allocation plans based on goals, time horizon, and risk profile." },
        { title: "Stock Tracking", text: "Track positions, performance, and changes in a simple review workflow." },
        { title: "Risk Review", text: "Identify exposure, concentration, and volatility before they become problems." },
      ],
      approachTitle: "From data to confident decisions",
      approachIntro: "A structured process for collecting information, analyzing risk, and communicating next steps.",
      steps: [
        { title: "Profile", text: "Capture goals, capital, risk tolerance, and investment constraints." },
        { title: "Analyze", text: "Review holdings, opportunities, and risks with transparent assumptions." },
        { title: "Act", text: "Create a practical action plan and monitor results over time." },
      ],
    };
  }

  return {
    accent,
    eyebrow: isSaas ? "Product website" : "AI generated website",
    heading: `${safeName} built for clarity and conversion`,
    lead: "A complete responsive website draft with strong hierarchy, service sections, conversion actions, and a contact workflow.",
    visualTitle: "Project snapshot",
    visualText: "A ready-to-edit structure with homepage, feature cards, process section, and contact form.",
    metrics: [
      { value: "4", label: "Sections" },
      { value: "100%", label: "Responsive" },
      { value: "1", label: "Clear CTA" },
    ],
    servicesTitle: "What this website communicates",
    servicesIntro: "A focused layout that explains the offer, builds trust, and guides visitors toward action.",
    services: [
      { title: "Clear Positioning", text: "Present the core offer with concise messaging and a strong first impression." },
      { title: "Feature Highlights", text: "Show the most important capabilities in a scannable card layout." },
      { title: "Lead Capture", text: "Give visitors a simple way to contact the business and start a conversation." },
    ],
    approachTitle: "Simple structure, easy to customize",
    approachIntro: "The generated draft gives you a professional base that can be edited with future prompts.",
    steps: [
      { title: "Define", text: "Turn the request into a clear site goal and visual direction." },
      { title: "Generate", text: "Create responsive sections with realistic copy and calls to action." },
      { title: "Refine", text: "Use the agent chat to change colors, sections, copy, and layout." },
    ],
  };
}

function titleFromPrompt(prompt: string) {
  const clean = prompt.replace(/[^\w\s-]/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 3);
  return words.length ? words.map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ") : "Untitled";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}
