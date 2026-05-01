import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Bot, Briefcase, ChevronRight, Globe2, Grid2X2, Loader2, LogOut, Mic, PanelLeft, Plus,
  Search, Settings2, Sparkles, Trash2, User, Users, Wallet
} from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ProfileMenu } from "@/components/dashboard/ProfileMenu";
import { RecentApps } from "@/components/dashboard/RecentApps";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, supabase, type Client, type Stock, type Website } from "@/lib/supabase";
import {
  addClient, addStock, addWebsite, clearLocalUser, dashboardStats, deleteClient,
  fetchClients, fetchStocks, fetchWebsites, generatedWebsiteHtml, publishWebsite, setLocalUser
} from "@/lib/stockpro";
import { consumeToken, createAppFromPrompt, getTokenState } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "dashboard" | "apps" | "clients" | "stocks" | "websites" | "profile";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [clients, setClients] = useState<Client[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [stats, setStats] = useState({ totalClients: 0, portfolioValue: 0, websitesBuilt: 0, recentClients: [] as Client[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const { user, displayName, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [clientRows, stockRows, websiteRows, statRows] = await Promise.all([
        fetchClients(),
        fetchStocks(),
        fetchWebsites(),
        dashboardStats(),
      ]);
      setClients(clientRows);
      setStocks(stockRows);
      setWebsites(websiteRows);
      setStats(statRows);
    } catch (e: any) {
      setError(e?.message || "Data load nahi hua.");
      toast({ title: "Data load failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(client => client.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const logout = async () => {
    clearLocalUser();
    if (isSupabaseConfigured) await supabase.auth.signOut();
    toast({ title: "Logged out" });
  };

  const createAiProject = (prompt: string) => {
    if (!consumeToken()) {
      toast({ title: "Daily tokens finished", description: "Aaj ke 20 free tokens khatam ho gaye. Pro plan lo ya kal fir 20 tokens milenge.", variant: "destructive" });
      return;
    }
    const app = createAppFromPrompt(prompt);
    toast({ title: "Project created", description: `${getTokenState().remaining} tokens remaining today.` });
    navigate(`/app/${app.id}`);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar activeTab={tab} collapsed={collapsed} onSelectTab={setTab} onToggle={() => setCollapsed(c => !c)} />
      <main className="flex-1 relative overflow-y-auto scrollbar-thin">
        <div className="absolute inset-0 bg-gradient-warm pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-aurora opacity-60 pointer-events-none" />
        <div className="relative z-10 min-h-full flex flex-col">
          <header className="flex items-center justify-between px-2 py-2 gap-4">
            <button onClick={() => setCollapsed(c => !c)} className="h-9 w-9 rounded-lg hover:bg-card/60 flex items-center justify-center text-foreground/70 transition-colors">
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-card/80 backdrop-blur-xl border border-border shadow-soft overflow-x-auto">
              {[
                { key: "dashboard", label: "Apps", icon: Grid2X2 },
                { key: "clients", label: "Superagents", icon: Bot },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as Tab)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap", tab === key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
              <span className="rounded-md bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700">New</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ProfileMenu name={displayName} email={user?.email ?? ""} onLogout={logout} />
            </div>
          </header>

          <section className="px-8 pb-8 space-y-5">
            {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
            {tab === "dashboard" && <DashboardTab loading={loading} stats={stats} onCreate={createAiProject} />}
            {tab === "apps" && <AppsTab query={appSearch} setQuery={setAppSearch} />}
            {tab === "clients" && (
              <ClientsTab clients={filteredClients} allClients={clients} search={clientSearch} setSearch={setClientSearch} loading={loading} onRefresh={loadData} />
            )}
            {tab === "stocks" && <StocksTab stocks={stocks} clients={clients} loading={loading} onRefresh={loadData} />}
            {tab === "websites" && <WebsitesTab websites={websites} clients={clients} loading={loading} onRefresh={loadData} />}
            {tab === "profile" && (
              <ProfileTab userEmail={user?.email ?? ""} displayName={displayName} clients={clients} stocks={stocks} websites={websites} refreshProfile={refreshProfile} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const DashboardTab = ({ loading, stats, onCreate }: { loading: boolean; stats: Awaited<ReturnType<typeof dashboardStats>>; onCreate: (prompt: string) => void }) => {
  const [prompt, setPrompt] = useState("");
  const tokens = getTokenState();
  const submit = () => {
    const value = prompt.trim();
    if (!value) return;
    onCreate(value);
  };

  return (
  <div className="space-y-0">
    <section className="mx-auto flex min-h-[430px] w-full max-w-[860px] flex-col items-center justify-center pt-8 text-center">
      <h1 className="text-[28px] font-semibold tracking-normal text-foreground md:text-[30px]">What will you build next?</h1>
      <div className="mt-7 w-full rounded-xl border border-white/80 bg-white/50 p-3 text-left shadow-soft backdrop-blur-sm">
        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-soft">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
            }}
            placeholder="Describe the app you want to create..."
            className="min-h-[92px] resize-none border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-7 w-7 rounded-md"><Plus className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="outline" className="h-7 w-7 rounded-md"><Settings2 className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span>{tokens.remaining}/20 tokens</span>
              <span className="h-5 w-9 rounded-full bg-muted p-0.5"><span className="block h-4 w-4 rounded-full bg-white shadow-soft" /></span>
              <Mic className="h-3.5 w-3.5" />
              <Button size="icon" onClick={submit} className="h-8 w-8 rounded-lg bg-black text-white hover:bg-black/90"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">What would you like to create?</p>
          <div className="flex flex-wrap gap-2">
            {["Tasks & Workflows", "CRM & Sales", "Content & Sites", "Finance", "Booking", "... More"].map(item => (
              <Button key={item} variant="secondary" size="sm" className="h-7 rounded-md bg-card px-3 text-xs font-medium shadow-soft">
                {item}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto w-full max-w-[1036px] rounded-t-2xl bg-card p-7 shadow-elegant">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 rounded-md px-3 text-xs">Recent apps</Button>
          <Button variant="ghost" size="sm" className="h-7 rounded-md px-3 text-xs">Templates</Button>
        </div>
        <Button variant="ghost" size="sm" className="h-7 rounded-md px-3 text-xs">
          View all <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Total Clients" value={loading ? "" : String(stats.totalClients)} loading={loading} />
        <StatCard icon={Wallet} label="Portfolio Value" value={loading ? "" : currency.format(stats.portfolioValue)} loading={loading} />
        <StatCard icon={Globe2} label="Websites Built" value={loading ? "" : String(stats.websitesBuilt)} loading={loading} />
      </div>
      <div className="mt-5">
        {loading ? <SkeletonRows /> : stats.recentClients.length === 0 ? <Empty message="Koi client nahi hai. All apps me jaakar Add Client dabao." /> : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {stats.recentClients.map(client => (
              <div key={client.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(client.created_at).toLocaleString()}</p>
                </div>
                <span className="text-sm">{currency.format(Number(client.investment_amount || 0))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  </div>
  );
};

const AppsTab = ({ query, setQuery }: { query: string; setQuery: (value: string) => void }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold">All apps</h1>
        <p className="text-sm text-muted-foreground">Your generated websites and saved projects.</p>
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search apps" className="pl-9" />
      </div>
    </div>
    <RecentApps query={query} />
  </div>
);

const ClientsTab = ({ clients, allClients, search, setSearch, loading, onRefresh }: any) => (
  <Panel title="Clients" action={<AddClientButton onRefresh={onRefresh} />}>
    <div className="relative mb-4">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients by name" className="pl-9" />
    </div>
    {loading ? <SkeletonRows /> : allClients.length === 0 ? <Empty message="Koi client nahi hai. + Add Client dabao" /> : (
      <div className="space-y-2">
        {clients.map((client: Client) => <ClientRow key={client.id} client={client} onRefresh={onRefresh} />)}
      </div>
    )}
  </Panel>
);

const StocksTab = ({ stocks, clients, loading, onRefresh }: { stocks: Stock[]; clients: Client[]; loading: boolean; onRefresh: () => void }) => {
  const clientById = new Map(clients.map(client => [client.id, client.name]));
  const grouped = stocks.reduce<Record<string, number>>((acc, stock) => {
    const label = clientById.get(stock.client_id ?? "") || "Unassigned";
    acc[label] = (acc[label] || 0) + Number(stock.current_price || 0) * Number(stock.quantity || 0);
    return acc;
  }, {});
  return (
    <Panel title="Stock Tracker" action={<AddStockButton clients={clients} onRefresh={onRefresh} />}>
      {loading ? <SkeletonRows /> : stocks.length === 0 ? <Empty message="No stocks added yet." /> : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-2">
            {stocks.map(stock => {
              const pnl = (Number(stock.current_price) - Number(stock.buy_price)) * Number(stock.quantity);
              return (
                <div key={stock.id} className="rounded-xl bg-secondary/50 p-3 grid grid-cols-2 md:grid-cols-6 gap-3 items-center">
                  <div><p className="font-semibold">{stock.symbol}</p><p className="text-xs text-muted-foreground">{stock.company_name}</p></div>
                  <p className="text-sm">{clientById.get(stock.client_id ?? "") || "Unassigned"}</p>
                  <p className="text-sm">Buy {currency.format(Number(stock.buy_price))}</p>
                  <p className="text-sm">Now {currency.format(Number(stock.current_price))}</p>
                  <p className="text-sm">Qty {stock.quantity}</p>
                  <p className={cn("text-sm font-semibold", pnl >= 0 ? "text-green-600" : "text-red-600")}>{currency.format(pnl)}</p>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl bg-secondary/40 p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">Client-wise Holdings</h3>
            {Object.entries(grouped).map(([name, value]) => (
              <div key={name} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                <span>{name}</span><span className="font-medium">{currency.format(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
};

const WebsitesTab = ({ websites, clients, loading, onRefresh }: { websites: Website[]; clients: Client[]; loading: boolean; onRefresh: () => void }) => {
  const clientById = new Map(clients.map(client => [client.id, client.name]));
  const { toast } = useToast();
  const [publishing, setPublishing] = useState("");
  const publish = async (id: string) => {
    setPublishing(id);
    try {
      await publishWebsite(id);
      toast({ title: "Website live ho gayi!" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Publish failed", description: e?.message, variant: "destructive" });
    } finally {
      setPublishing("");
    }
  };
  return (
    <Panel title="AI Websites" action={<GenerateWebsiteButton clients={clients} onRefresh={onRefresh} />}>
      {loading ? <SkeletonRows /> : websites.length === 0 ? <Empty message="No websites generated yet." /> : (
        <div className="space-y-2">
          {websites.map(site => (
            <div key={site.id} className="rounded-xl bg-secondary/50 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium capitalize">{site.template_type} website</p>
                <p className="text-xs text-muted-foreground truncate">{clientById.get(site.client_id ?? "") || "No client"} • {site.prompt_used}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs px-2 py-1 rounded-full", site.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>{site.status}</span>
                <Button size="sm" variant="secondary" disabled={site.status === "published" || publishing === site.id} onClick={() => publish(site.id)}>
                  {publishing === site.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Publish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};

const ProfileTab = ({ userEmail, displayName, clients, stocks, websites, refreshProfile }: any) => {
  const [name, setName] = useState(displayName);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => setName(displayName), [displayName]);

  const saveName = async () => {
    if (!user) return;
    setLoading(true);
    if (!isSupabaseConfigured || user.id === "local-user") {
      setLocalUser(userEmail, name);
      await refreshProfile();
      setLoading(false);
      toast({ title: "Profile saved" });
      return;
    }
    const { error: metaError } = await supabase.auth.updateUser({ data: { name } });
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, name });
    setLoading(false);
    if (metaError || profileError) return toast({ title: "Profile update failed", description: metaError?.message || profileError?.message, variant: "destructive" });
    await refreshProfile();
    toast({ title: "Profile saved" });
  };

  const changePassword = async () => {
    if (!isSupabaseConfigured) {
      toast({ title: "Local dev mode", description: "Password reset needs a configured Supabase project." });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo: window.location.origin });
    setPasswordLoading(false);
    if (error) return toast({ title: "Password email failed", description: error.message, variant: "destructive" });
    toast({ title: "Change password email sent" });
  };

  return (
    <Panel title="Profile / Account">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input value={userEmail} readOnly /></div>
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={saveName} disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save name</Button>
            <Button variant="secondary" onClick={changePassword} disabled={passwordLoading}>{passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Change Password</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <StatCard icon={Users} label="Total Clients" value={String(clients.length)} />
          <StatCard icon={BarChart3} label="Total Stocks" value={String(stocks.length)} />
          <StatCard icon={Globe2} label="Websites Published" value={String(websites.filter((w: Website) => w.status === "published").length)} />
        </div>
      </div>
    </Panel>
  );
};

const AddClientButton = ({ onRefresh }: { onRefresh: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", investment_amount: "", risk_profile: "moderate" });
  const { toast } = useToast();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await addClient({
      name: form.name,
      phone: form.phone,
      investment_amount: Number(form.investment_amount || 0),
      risk_profile: form.risk_profile,
    } as any);
      toast({ title: "Client add ho gaya!" });
      setOpen(false);
      setForm({ name: "", phone: "", investment_amount: "", risk_profile: "moderate" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Client add failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Client</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Investment Amount"><Input type="number" value={form.investment_amount} onChange={e => setForm({ ...form, investment_amount: e.target.value })} required /></Field>
          <Field label="Risk Profile"><select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.risk_profile} onChange={e => setForm({ ...form, risk_profile: e.target.value })}><option value="conservative">Conservative</option><option value="moderate">Moderate</option><option value="aggressive">Aggressive</option></select></Field>
          <Button disabled={loading} className="w-full">{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Client</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddStockButton = ({ clients, onRefresh }: { clients: Client[]; onRefresh: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ symbol: "", company_name: "", buy_price: "", current_price: "", quantity: "", client_id: "" });
  const { toast } = useToast();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await addStock({
      client_id: form.client_id || null,
      symbol: form.symbol.toUpperCase(),
      company_name: form.company_name,
      buy_price: Number(form.buy_price),
      current_price: Number(form.current_price),
      quantity: Number(form.quantity),
    });
      toast({ title: "Stock saved" });
      setOpen(false);
      setForm({ symbol: "", company_name: "", buy_price: "", current_price: "", quantity: "", client_id: "" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Stock add failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Stock</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>Add Stock</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Symbol"><Input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} required /></Field>
          <Field label="Company Name"><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Buy"><Input type="number" value={form.buy_price} onChange={e => setForm({ ...form, buy_price: e.target.value })} required /></Field>
            <Field label="Current"><Input type="number" value={form.current_price} onChange={e => setForm({ ...form, current_price: e.target.value })} required /></Field>
            <Field label="Qty"><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required /></Field>
          </div>
          <Field label="Client"><ClientSelect clients={clients} value={form.client_id} onChange={client_id => setForm({ ...form, client_id })} /></Field>
          <Button disabled={loading} className="w-full">{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Stock</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GenerateWebsiteButton = ({ clients, onRefresh }: { clients: Client[]; onRefresh: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ client_id: "", template_type: "portfolio", prompt_used: "" });
  const { toast } = useToast();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await addWebsite({
      client_id: form.client_id || null,
      template_type: form.template_type as Website["template_type"],
      prompt_used: form.prompt_used,
      generated_html: generatedWebsiteHtml(form.prompt_used),
      status: "draft",
      url_slug: `site-${Date.now()}`,
    });
      toast({ title: "Website draft saved" });
      setOpen(false);
      setForm({ client_id: "", template_type: "portfolio", prompt_used: "" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Website generation failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Generate Website</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>Generate Website</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Client"><ClientSelect clients={clients} value={form.client_id} onChange={client_id => setForm({ ...form, client_id })} /></Field>
          <Field label="Template"><select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.template_type} onChange={e => setForm({ ...form, template_type: e.target.value })}><option value="portfolio">Portfolio</option><option value="business">Business</option><option value="landing">Landing</option><option value="blog">Blog</option></select></Field>
          <Field label="Prompt"><Textarea value={form.prompt_used} onChange={e => setForm({ ...form, prompt_used: e.target.value })} required /></Field>
          <Button disabled={loading} className="w-full">{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Generate</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ClientRow = ({ client, onRefresh }: { client: Client; onRefresh: () => void }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const remove = async () => {
    if (!window.confirm(`Delete ${client.name}?`)) return;
    setLoading(true);
    try {
      await deleteClient(client.id);
      toast({ title: "Client deleted" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="rounded-xl bg-secondary/50 p-3 grid grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center">
      <div><p className="font-semibold">{client.name}</p><p className="text-xs text-muted-foreground">{client.risk_profile}</p></div>
      <p className="text-sm">{client.phone || "-"}</p>
      <p className="text-sm">{currency.format(Number(client.investment_amount || 0))}</p>
      <p className={cn("text-sm font-semibold", Number(client.returns_percent) >= 0 ? "text-green-600" : "text-red-600")}>{client.returns_percent ?? 0}%</p>
      <span className={cn("text-xs px-2 py-1 rounded-full w-fit", client.website_status === "live" ? "bg-green-100 text-green-700" : client.website_status === "building" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700")}>{client.website_status}</span>
      <Button variant="secondary" size="sm" onClick={remove} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
    </div>
  );
};

const ClientSelect = ({ clients, value, onChange }: { clients: Client[]; value: string; onChange: (value: string) => void }) => (
  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={e => onChange(e.target.value)}>
    <option value="">Unassigned</option>
    {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
  </select>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-2"><Label>{label}</Label>{children}</div>;

const Panel = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-elegant p-5">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const StatCard = ({ icon: Icon, label, value, loading }: any) => (
  <div className="rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-soft p-5">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground"><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="h-7 w-28 mt-1" /> : <p className="text-2xl font-semibold">{value}</p>}
      </div>
    </div>
  </div>
);

const SkeletonRows = () => <div className="space-y-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>;
const Empty = ({ message }: { message: string }) => <div className="py-14 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">{message}</div>;

const Index = () => (
  <ThemeProvider>
    <Dashboard />
  </ThemeProvider>
);

export default Index;
