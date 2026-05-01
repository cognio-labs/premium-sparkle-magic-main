import { useState } from "react";
import { LayoutGrid, Sparkles, PanelLeft } from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ProfileMenu } from "@/components/dashboard/ProfileMenu";
import { PromptCard } from "@/components/dashboard/PromptCard";
import { RecentApps } from "@/components/dashboard/RecentApps";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState<"apps" | "agents">("apps");
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <main className="flex-1 relative overflow-y-auto scrollbar-thin">
        {/* Aurora background */}
        <div className="absolute inset-0 bg-gradient-warm pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-aurora opacity-70 pointer-events-none" />

        <div className="relative z-10 min-h-full flex flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="h-9 w-9 rounded-lg hover:bg-card/60 flex items-center justify-center text-foreground/70 transition-colors"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 p-1 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-soft">
              <button
                onClick={() => setMode("apps")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all",
                  mode === "apps" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Apps
              </button>
              <button
                onClick={() => setMode("agents")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all relative",
                  mode === "agents" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" /> Superagents
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground font-semibold">New</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <SearchBar value={query} onChange={setQuery} />
              </div>
              <ProfileMenu />
            </div>
          </header>

          <div className="md:hidden px-6 pb-2">
            <SearchBar value={query} onChange={setQuery} />
          </div>

          {/* Hero */}
          <section className="flex-1 flex flex-col items-center justify-center px-6 py-10">
            <h1 className="font-display text-5xl sm:text-6xl text-foreground text-center mb-10 animate-fade-in">
              What will you build next?
            </h1>
            <PromptCard />
          </section>

          {/* Recents */}
          <section className="px-4 sm:px-8">
            <RecentApps query={query} />
          </section>
        </div>
      </main>
    </div>
  );
};

const Index = () => (
  <ThemeProvider>
    <Dashboard />
  </ThemeProvider>
);

export default Index;
