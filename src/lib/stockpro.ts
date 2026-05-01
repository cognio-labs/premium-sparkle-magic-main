import { isSupabaseConfigured, supabase, type Client, type Stock, type Website } from "@/lib/supabase";

const LOCAL_USER_KEY = "stockpro.localUser";
const LOCAL_CLIENTS_KEY = "stockpro.clients";
const LOCAL_STOCKS_KEY = "stockpro.stocks";
const LOCAL_WEBSITES_KEY = "stockpro.websites";

type LocalUser = { id: string; email: string; name: string };

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalUser(): LocalUser | null {
  return readLocal<LocalUser | null>(LOCAL_USER_KEY, null);
}

export function setLocalUser(email: string, name?: string) {
  const user = {
    id: "local-user",
    email,
    name: name || email.split("@")[0] || "User",
  };
  writeLocal(LOCAL_USER_KEY, user);
  window.dispatchEvent(new Event("stockpro-local-auth"));
  return user;
}

export function clearLocalUser() {
  localStorage.removeItem(LOCAL_USER_KEY);
  window.dispatchEvent(new Event("stockpro-local-auth"));
}

export async function currentUserId() {
  if (!isSupabaseConfigured) {
    const user = getLocalUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Not authenticated");
  return data.user.id;
}

export async function fetchClients() {
  const userId = await currentUserId();
  if (!isSupabaseConfigured) {
    return readLocal<Client[]>(LOCAL_CLIENTS_KEY, []).filter(row => row.user_id === userId).sort(sortDesc);
  }
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function fetchStocks() {
  const userId = await currentUserId();
  if (!isSupabaseConfigured) {
    return readLocal<Stock[]>(LOCAL_STOCKS_KEY, []).filter(row => row.user_id === userId).sort(sortDesc);
  }
  const { data, error } = await supabase
    .from("stocks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Stock[];
}

export async function fetchWebsites() {
  const userId = await currentUserId();
  if (!isSupabaseConfigured) {
    return readLocal<Website[]>(LOCAL_WEBSITES_KEY, []).filter(row => row.user_id === userId).sort(sortDesc);
  }
  const { data, error } = await supabase
    .from("websites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Website[];
}

export async function dashboardStats() {
  const userId = await currentUserId();
  if (!isSupabaseConfigured) {
    const clients = readLocal<Client[]>(LOCAL_CLIENTS_KEY, []).filter(row => row.user_id === userId).sort(sortDesc);
    const stocks = readLocal<Stock[]>(LOCAL_STOCKS_KEY, []).filter(row => row.user_id === userId);
    const websites = readLocal<Website[]>(LOCAL_WEBSITES_KEY, []).filter(row => row.user_id === userId);
    return {
      totalClients: clients.length,
      portfolioValue: stocks.reduce((sum, stock) => sum + Number(stock.current_price || 0) * Number(stock.quantity || 0), 0),
      websitesBuilt: websites.filter(site => site.status === "published").length,
      recentClients: clients.slice(0, 5),
    };
  }
  const [clientsRes, stocksRes, websitesRes, recentRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("stocks").select("current_price, quantity").eq("user_id", userId),
    supabase.from("websites").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "published"),
    supabase.from("clients").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
  ]);

  const error = clientsRes.error || stocksRes.error || websitesRes.error || recentRes.error;
  if (error) throw error;

  const portfolioValue = (stocksRes.data ?? []).reduce((sum, stock) => {
    return sum + Number(stock.current_price ?? 0) * Number(stock.quantity ?? 0);
  }, 0);

  return {
    totalClients: clientsRes.count ?? 0,
    portfolioValue,
    websitesBuilt: websitesRes.count ?? 0,
    recentClients: (recentRes.data ?? []) as Client[],
  };
}

export async function addClient(input: Pick<Client, "name" | "phone" | "risk_profile"> & { investment_amount: number }) {
  const userId = await currentUserId();
  if (!isSupabaseConfigured) {
    const rows = readLocal<Client[]>(LOCAL_CLIENTS_KEY, []);
    rows.unshift({
      id: crypto.randomUUID(),
      user_id: userId,
      name: input.name,
      phone: input.phone,
      investment_amount: input.investment_amount,
      risk_profile: input.risk_profile,
      returns_percent: 0,
      website_status: "none",
      created_at: new Date().toISOString(),
    });
    writeLocal(LOCAL_CLIENTS_KEY, rows);
    return;
  }
  const { error } = await supabase.from("clients").insert({
    user_id: userId,
    name: input.name,
    phone: input.phone,
    investment_amount: input.investment_amount,
    risk_profile: input.risk_profile,
    returns_percent: 0,
    website_status: "none",
  });
  if (error) throw error;
}

export async function deleteClient(id: string) {
  if (!isSupabaseConfigured) {
    writeLocal(LOCAL_CLIENTS_KEY, readLocal<Client[]>(LOCAL_CLIENTS_KEY, []).filter(row => row.id !== id));
    writeLocal(LOCAL_STOCKS_KEY, readLocal<Stock[]>(LOCAL_STOCKS_KEY, []).filter(row => row.client_id !== id));
    writeLocal(LOCAL_WEBSITES_KEY, readLocal<Website[]>(LOCAL_WEBSITES_KEY, []).filter(row => row.client_id !== id));
    return;
  }
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function addStock(input: Omit<Stock, "id" | "user_id" | "created_at">) {
  const userId = await currentUserId();
  if (!isSupabaseConfigured) {
    const rows = readLocal<Stock[]>(LOCAL_STOCKS_KEY, []);
    rows.unshift({ ...input, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() });
    writeLocal(LOCAL_STOCKS_KEY, rows);
    return;
  }
  const { error } = await supabase.from("stocks").insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function addWebsite(input: Omit<Website, "id" | "user_id" | "created_at">) {
  const userId = await currentUserId();
  if (!isSupabaseConfigured) {
    const rows = readLocal<Website[]>(LOCAL_WEBSITES_KEY, []);
    rows.unshift({ ...input, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() });
    writeLocal(LOCAL_WEBSITES_KEY, rows);
    return;
  }
  const { error } = await supabase.from("websites").insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function publishWebsite(id: string) {
  if (!isSupabaseConfigured) {
    const rows = readLocal<Website[]>(LOCAL_WEBSITES_KEY, []).map(row => row.id === id ? { ...row, status: "published" as const } : row);
    writeLocal(LOCAL_WEBSITES_KEY, rows);
    return;
  }
  const { error } = await supabase.from("websites").update({ status: "published" }).eq("id", id);
  if (error) throw error;
}

function sortDesc(a: { created_at: string }, b: { created_at: string }) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function generatedWebsiteHtml(prompt: string) {
  const safePrompt = prompt.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StockPro Website</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f8fbff;color:#182436}.wrap{max-width:920px;margin:0 auto;padding:72px 24px}.hero{background:white;border:1px solid #dce6f0;border-radius:24px;padding:40px;box-shadow:0 20px 60px -24px rgba(40,80,120,.22)}h1{font-size:44px;margin:0 0 16px}p{font-size:18px;line-height:1.7;color:#4b5f73}.cta{display:inline-block;margin-top:18px;padding:12px 18px;border-radius:14px;background:#2f7bbd;color:white;text-decoration:none;font-weight:700}</style></head><body><main class="wrap"><section class="hero"><h1>Your advisory website is ready</h1><p>${safePrompt || "AI-powered portfolio advisory experience created with StockPro."}</p><a class="cta" href="#">Book a consultation</a></section></main></body></html>`;
}
