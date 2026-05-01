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
  const safePrompt = escapeHtml(prompt);
  const accent = prompt.toLowerCase().includes("finance") ? "#2563eb" : prompt.toLowerCase().includes("space") ? "#ff5f1f" : "#111827";
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeName}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #151515; background: #faf8f4; }
      .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; background: linear-gradient(135deg, #fffaf3 0%, #ffd2ad 58%, ${accent} 100%); }
      .copy { padding: 88px 8vw; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
      .eyebrow { width: fit-content; border: 1px solid rgba(0,0,0,.12); border-radius: 999px; padding: 8px 12px; font-size: 13px; background: rgba(255,255,255,.55); }
      h1 { margin: 0; font-size: clamp(42px, 6vw, 88px); line-height: .94; letter-spacing: 0; }
      p { font-size: 18px; line-height: 1.7; color: #3d3d3d; max-width: 620px; }
      .actions { display: flex; gap: 12px; flex-wrap: wrap; }
      .btn { border: 0; border-radius: 12px; padding: 13px 18px; font-weight: 700; background: #111; color: white; }
      .btn.secondary { background: rgba(255,255,255,.75); color: #111; border: 1px solid rgba(0,0,0,.1); }
      .visual { display: flex; align-items: center; justify-content: center; padding: 48px; }
      .panel { width: min(460px, 90%); border-radius: 24px; background: rgba(255,255,255,.82); box-shadow: 0 30px 90px rgba(0,0,0,.18); overflow: hidden; border: 1px solid rgba(255,255,255,.75); }
      .panel-head { height: 160px; background: radial-gradient(circle at 70% 30%, #ff5f1f, transparent 45%), linear-gradient(135deg, #161616, ${accent}); }
      .panel-body { padding: 28px; display: grid; gap: 14px; }
      .row { border: 1px solid #ececec; border-radius: 12px; padding: 14px; background: #fff; display: flex; justify-content: space-between; }
      @media (max-width: 820px) { .hero { grid-template-columns: 1fr; } .visual { padding-top: 0; } }
    </style>
  </head>
  <body>
    <main class="hero">
      <section class="copy">
        <div class="eyebrow">Built with React, TypeScript, Node.js, Supabase and Tailwind</div>
        <h1>${safeName}</h1>
        <p>${safePrompt}</p>
        <div class="actions">
          <button class="btn">Start now</button>
          <button class="btn secondary">View details</button>
        </div>
      </section>
      <section class="visual">
        <div class="panel">
          <div class="panel-head"></div>
          <div class="panel-body">
            <div class="row"><strong>Frontend</strong><span>React + Tailwind</span></div>
            <div class="row"><strong>Logic</strong><span>TypeScript</span></div>
            <div class="row"><strong>Backend</strong><span>Node + Supabase</span></div>
            <div class="row"><strong>Status</strong><span>Preview ready</span></div>
          </div>
        </div>
      </section>
    </main>
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

function titleFromPrompt(prompt: string) {
  const clean = prompt.replace(/[^\w\s-]/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 3);
  return words.length ? words.map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ") : "Untitled";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}
