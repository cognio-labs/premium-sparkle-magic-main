import {
  LayoutGrid, Home, AppWindow, FileText, Plug,
  Sparkles, Gift, ChevronDown, Star, Crown, PanelLeft, Briefcase, Rocket
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApps, useFavorites } from "@/lib/store";

const navMain = [
  { icon: Home, label: "Home", active: true },
  { icon: AppWindow, label: "All apps" },
  { icon: FileText, label: "Templates" },
  { icon: Plug, label: "Integrations" },
];

const community = [
  { icon: Briefcase, label: "Hire a Partner" },
  { icon: Sparkles, label: "Spotlight" },
  { icon: Gift, label: "Affiliate Program" },
];

export const Sidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  const [openCommunity, setOpenCommunity] = useState(true);
  const [openFavs, setOpenFavs] = useState(true);
  const [openRecents, setOpenRecents] = useState(true);
  const apps = useApps();
  const favIds = useFavorites();
  const favoriteApps = apps.filter(a => favIds.includes(a.id));
  const recents = apps.slice(0, 5);

  if (collapsed) {
    return (
      <aside className="w-16 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl flex flex-col items-center py-4 gap-2">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
          <PanelLeft className="h-5 w-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl flex flex-col h-full">
      <div className="px-3 py-3 flex items-center gap-1">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-sidebar-accent/60 flex-1">
          <button className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card shadow-soft text-xs font-medium">
            <LayoutGrid className="h-3.5 w-3.5" /> Apps
          </button>
          <button className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Superagents
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 space-y-5">
        <div className="space-y-0.5">
          {navMain.map((it) => (<NavItem key={it.label} {...it} />))}
        </div>

        <Section title="Community" open={openCommunity} onToggle={() => setOpenCommunity(o => !o)}>
          {community.map((it) => <NavItem key={it.label} {...it} sub />)}
        </Section>

        <Section title="Favorites" open={openFavs} onToggle={() => setOpenFavs(o => !o)}>
          {favoriteApps.length === 0 ? (
            <div className="px-3 py-4 rounded-xl bg-sidebar-accent/40 border border-dashed border-sidebar-border text-center">
              <Star className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
              <p className="text-xs font-medium text-sidebar-foreground">No favorites yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Add your apps for quick access</p>
            </div>
          ) : (
            favoriteApps.map(a => <AppLink key={a.id} id={a.id} name={a.name} />)
          )}
        </Section>

        <Section title="Recents" open={openRecents} onToggle={() => setOpenRecents(o => !o)}>
          {recents.map(r => <AppLink key={r.id} id={r.id} name={r.name} />)}
        </Section>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-accent to-accent/40 hover:shadow-soft transition-all text-left group">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Crown className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground">Upgrade your plan</p>
            <p className="text-[11px] text-muted-foreground truncate">Get more out of your apps</p>
          </div>
        </button>
      </div>
    </aside>
  );
};

const AppLink = ({ id, name }: { id: string; name: string }) => (
  <Link to={`/app/${id}`} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
    <div className="h-5 w-5 rounded-md bg-gradient-primary shrink-0 flex items-center justify-center">
      <Rocket className="h-3 w-3 text-primary-foreground" />
    </div>
    <span className="truncate">{name}</span>
  </Link>
);

const NavItem = ({ icon: Icon, label, active, sub }: any) => (
  <button
    className={cn(
      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all",
      active ? "bg-card text-foreground shadow-soft" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      sub && "text-[13px]"
    )}
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

const Section = ({ title, open, onToggle, children }: any) => (
  <div className="space-y-1">
    <button onClick={onToggle} className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
      <span>{title}</span>
      <ChevronDown className={cn("h-3 w-3 transition-transform", !open && "-rotate-90")} />
    </button>
    {open && <div className="space-y-0.5">{children}</div>}
  </div>
);
