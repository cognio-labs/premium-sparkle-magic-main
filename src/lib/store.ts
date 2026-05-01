import { useEffect, useState } from "react";

export type App = {
  id: string;
  name: string;
  tags: string[];
  prompt?: string;
  preview?: string;
  createdAt: number;
  updatedAt: number;
  iconGradient?: string;
};

const APPS_KEY = "lov.apps";
const FAVS_KEY = "lov.favorites";

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
