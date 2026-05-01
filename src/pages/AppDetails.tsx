import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Trash2, ExternalLink, Save, X, Plus, Eye, Code } from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getApp, upsertApp, useFavorites, toggleFavorite, getApps, saveApps, type App } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AppDetailsInner = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const favs = useFavorites();
  const isFav = favs.includes(id);

  const [app, setApp] = useState<App | undefined>(() => getApp(id));
  const [name, setName] = useState(app?.name ?? "");
  const [tags, setTags] = useState<string[]>(app?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const fresh = getApp(id);
    setApp(fresh);
    setName(fresh?.name ?? "");
    setTags(fresh?.tags ?? []);
  }, [id]);

  if (!app) {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-4xl mb-2">App not found</h1>
        <p className="text-muted-foreground mb-6">This project doesn't exist or was deleted.</p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-soft">Back to dashboard</Link>
      </div>
    );
  }

  const save = () => {
    upsertApp({ ...app, name: name.trim() || "Untitled", tags, updatedAt: Date.now() });
    setDirty(false);
    toast({ title: "Saved", description: "Your changes have been saved." });
  };

  const remove = () => {
    saveApps(getApps().filter(a => a.id !== id));
    toast({ title: "Deleted", description: `"${app.name}" was removed.` });
    navigate("/");
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    setTags([...tags, t]); setTagInput(""); setDirty(true);
  };

  const previewSrc = app.preview || `<!doctype html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;color:#666;background:#fafafa">No preview available</body></html>`;

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="absolute inset-0 bg-gradient-warm pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-aurora opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6">
        {/* Top row */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(id)}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all border border-border",
                isFav ? "bg-accent text-primary" : "bg-card hover:bg-accent text-muted-foreground"
              )}
              aria-label={isFav ? "Unfavorite" : "Favorite"}
            >
              <Star className={cn("h-4 w-4", isFav && "fill-current")} />
            </button>
            <button onClick={remove} className="h-9 w-9 rounded-xl bg-card hover:bg-destructive hover:text-destructive-foreground border border-border text-muted-foreground flex items-center justify-center transition-colors" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              className="flex items-center gap-2 px-4 h-9 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-soft hover:shadow-elegant transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>

        {/* Editable name */}
        <div className="mb-2">
          <input
            value={name}
            onChange={e => { setName(e.target.value); setDirty(true); }}
            className="font-display text-5xl sm:text-6xl bg-transparent w-full focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40"
            placeholder="Untitled project"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Updated {new Date(app.updatedAt).toLocaleString()}
          </p>
        </div>

        {/* Tags */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              {t}
              <button onClick={() => { setTags(tags.filter(x => x !== t)); setDirty(true); }} className="h-5 w-5 rounded-full hover:bg-accent-foreground/10 flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-card/80 border border-border">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add tag"
              className="bg-transparent text-xs w-24 focus:outline-none"
            />
            <button onClick={addTag} className="h-5 w-5 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Preview actions */}
        <div className="mt-8 rounded-3xl bg-card/90 backdrop-blur-xl border border-border shadow-elegant overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary">
              <ViewBtn active={view === "preview"} onClick={() => setView("preview")} icon={Eye} label="Preview" />
              <ViewBtn active={view === "code"} onClick={() => setView("code")} icon={Code} label="Source" />
            </div>
            <button
              onClick={() => {
                const w = window.open("", "_blank");
                if (w) { w.document.write(previewSrc); w.document.close(); }
              }}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
            </button>
          </div>

          {view === "preview" ? (
            <iframe
              title="Project preview"
              srcDoc={previewSrc}
              sandbox="allow-scripts"
              className="w-full h-[560px] bg-white"
            />
          ) : (
            <pre className="p-5 text-xs overflow-auto max-h-[560px] bg-secondary/40 text-foreground whitespace-pre-wrap break-all">
              {previewSrc}
            </pre>
          )}
        </div>

        {app.prompt && (
          <div className="mt-6 p-5 rounded-2xl bg-card/70 backdrop-blur border border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Original prompt</p>
            <p className="text-sm text-foreground leading-relaxed">{app.prompt}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ViewBtn = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
      active ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Icon className="h-3.5 w-3.5" /> {label}
  </button>
);

const AppDetails = () => (
  <ThemeProvider>
    <AppDetailsInner />
  </ThemeProvider>
);

export default AppDetails;
