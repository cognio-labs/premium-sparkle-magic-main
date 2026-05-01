import { Plus, SlidersHorizontal, Mic, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { generateProject } from "@/lib/api";
import { upsertApp } from "@/lib/store";
import { SettingsDialog } from "./SettingsDialog";
import { useToast } from "@/hooks/use-toast";

const categories = ["Tasks & Workflows", "CRM & Sales", "Content & Sites", "Finance", "Booking", "··· More"];
const gradients = ["from-orange-300 to-rose-500", "from-amber-300 to-orange-600", "from-rose-300 to-fuchsia-500", "from-yellow-300 to-orange-500"];

export const PromptCard = () => {
  const [plan, setPlan] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!value.trim() || loading) return;
    setLoading(true);
    try {
      const result = await generateProject(value.trim());
      const id = `app-${Date.now()}`;
      upsertApp({
        id,
        name: result.name,
        tags: result.tags ?? [],
        prompt: value.trim(),
        preview: result.preview,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        iconGradient: gradients[Math.floor(Math.random() * gradients.length)],
      });
      setValue("");
      navigate(`/app/${id}`);
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e?.message || "Check your API endpoint in settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
        <div className="relative rounded-3xl bg-card/90 backdrop-blur-xl border border-border shadow-elegant p-2.5">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
            placeholder="Describe the app you want to create..."
            rows={4}
            disabled={loading}
            className="w-full resize-none bg-transparent px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
          />
          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="flex items-center gap-1.5">
              <IconBtn onClick={() => {}}><Plus className="h-4 w-4" /></IconBtn>
              <IconBtn onClick={() => setSettingsOpen(true)} title="API settings"><SlidersHorizontal className="h-4 w-4" /></IconBtn>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPlan(p => !p)} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                <span>Plan</span>
                <span className={cn("relative h-5 w-9 rounded-full transition-colors", plan ? "bg-primary" : "bg-muted")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform", plan ? "translate-x-4" : "translate-x-0.5")} />
                </span>
              </button>
              <IconBtn onClick={() => {}}><Mic className="h-4 w-4" /></IconBtn>
              <button
                onClick={handleGenerate}
                disabled={loading || !value.trim()}
                className="h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center hover:bg-foreground/85 transition-colors shadow-soft disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground mb-3">What would you like to create?</p>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setValue(v => (v ? v + " " : "") + c)}
              className="px-4 py-2 rounded-full bg-card/80 backdrop-blur border border-border text-xs font-medium hover:bg-card hover:shadow-soft transition-all"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

const IconBtn = ({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) => (
  <button onClick={onClick} title={title} className="h-8 w-8 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center text-foreground transition-colors">
    {children}
  </button>
);
