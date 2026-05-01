import { supabase, type Client, type Stock, type Website } from "@/lib/supabase";

export async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Not authenticated");
  return data.user.id;
}

export async function fetchClients() {
  const userId = await currentUserId();
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

export function generatedWebsiteHtml(prompt: string) {
  const safePrompt = prompt.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StockPro Website</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f8fbff;color:#182436}.wrap{max-width:920px;margin:0 auto;padding:72px 24px}.hero{background:white;border:1px solid #dce6f0;border-radius:24px;padding:40px;box-shadow:0 20px 60px -24px rgba(40,80,120,.22)}h1{font-size:44px;margin:0 0 16px}p{font-size:18px;line-height:1.7;color:#4b5f73}.cta{display:inline-block;margin-top:18px;padding:12px 18px;border-radius:14px;background:#2f7bbd;color:white;text-decoration:none;font-weight:700}</style></head><body><main class="wrap"><section class="hero"><h1>Your advisory website is ready</h1><p>${safePrompt || "AI-powered portfolio advisory experience created with StockPro."}</p><a class="cta" href="#">Book a consultation</a></section></main></body></html>`;
}
