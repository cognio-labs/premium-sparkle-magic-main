import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Rocket, FileText, Sparkles, Star, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApps, useFavorites, toggleFavorite, type App } from "@/lib/store";

const templates = [
  { id: "tpl-crm", name: "CRM Starter", iconGradient: "from-blue-400 to-indigo-600", tags: ["crm"] },
  { id: "tpl-blog", name: "Editorial Blog", iconGradient: "from-pink-300 to-rose-500", tags: ["content"] },
  { id: "tpl-shop", name: "Storefront", iconGradient: "from-emerald-400 to-teal-600", tags: ["ecommerce"] },
  { id: "tpl-book", name: "Booking Pro", iconGradient: "from-amber-400 to-orange-600", tags: ["booking"] },
];

export const RecentApps = ({ query }: { query: string }) => {
  const [tab, setTab] = useState<"recent" | "templates">("recent");
  const apps = useApps();
  const favs = useFavorites();

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(a => a.name.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)));
  }, [apps, query]);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(t => t.name.toLowerCase().includes(q) || t.tags.some(tg => tg.includes(q)));
  }, [query]);

  const items = tab === "recent" ? filteredApps : filteredTemplates;

  return (
    <div className="w-full bg-card/95 backdrop-blur-xl border-t border-border rounded-t-3xl shadow-elegant px-6 sm:px-10 pt-6 pb-10">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary">
          {(["recent", "templates"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                tab === t ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "recent" ? "Recent apps" : "Templates"}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center text-muted-foreground">
          <Search className="h-6 w-6 mb-2" />
          <p className="text-sm">No matches for "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((item: any) => (
            <AppCard
              key={item.id}
              item={item}
              isFavorite={favs.includes(item.id)}
              isApp={tab === "recent"}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AppCard = ({ item, isFavorite, isApp }: { item: App | any; isFavorite: boolean; isApp: boolean }) => {
  const Icon = item.name.toLowerCase().includes("space") ? Rocket : item.name === "untitled" ? FileText : Sparkles;
  const Wrapper: any = isApp ? Link : "div";
  const wrapperProps = isApp ? { to: `/app/${item.id}` } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 hover:bg-secondary border border-transparent hover:border-border transition-all text-left cursor-pointer"
    >
      <div className={cn("h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-soft", item.iconGradient)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {isApp ? "Edited recently" : "Template"}
        </p>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.id); }}
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
          isFavorite ? "opacity-100 text-primary" : "text-muted-foreground hover:bg-accent"
        )}
        aria-label={isFavorite ? "Unfavorite" : "Favorite"}
      >
        <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
      </button>
    </Wrapper>
  );
};
