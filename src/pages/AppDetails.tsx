import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Bot, Code2, Download, ExternalLink, Eye, FileCode2, Loader2, MessageSquare,
  MoreHorizontal, RefreshCw, Save, Send, Star, Trash2
} from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  consumeToken, getApp, getApps, getTokenState,
  saveApps, toggleFavorite, upsertApp, useFavorites, type App
} from "@/lib/store";
import { GEMINI_MODEL_OPTIONS, generateWebsiteWithGemini } from "@/lib/gemini";
import { cn } from "@/lib/utils";

const AppDetailsInner = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const favs = useFavorites();
  const isFav = favs.includes(id);
  const [app, setApp] = useState<App | undefined>(() => getApp(id));
  const [mode, setMode] = useState<"preview" | "code">("preview");
  const [activeFile, setActiveFile] = useState("index.html");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gemini-flash-latest");
  const [generating, setGenerating] = useState(false);
  const tokens = getTokenState();

  useEffect(() => {
    setApp(getApp(id));
  }, [id]);

  const files = useMemo(() => app?.files ?? { "index.html": app?.preview ?? "" }, [app]);
  const fileNames = Object.keys(files);
  const preview = app?.preview || files["index.html"] || "";
  const messages = app?.messages ?? [];

  if (!app) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-semibold mb-2">App not found</h1>
        <p className="text-muted-foreground mb-6">This project doesn't exist or was deleted.</p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-soft">Back home</Link>
      </div>
    );
  }

  const updateApp = (next: App) => {
    upsertApp(next);
    setApp(next);
  };

  const generate = async () => {
    const value = prompt.trim();
    if (!value) return;
    if (!consumeToken()) {
      toast({ title: "Tokens finished", description: "Aaj ke 20 free tokens khatam ho gaye. Pro plan lo ya kal fir 20 tokens milenge.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const mergedPrompt = `${app.prompt ?? app.name}\n\nUpdate request: ${value}`;
      const generated = await generateWebsiteWithGemini({
        appName: app.name,
        prompt: mergedPrompt,
        files,
        model,
      });
      updateApp({
        ...app,
        name: generated.name || app.name,
        tags: generated.tags || app.tags,
        preview: generated.preview,
        files: generated.files,
        prompt: mergedPrompt,
        messages: [
          ...messages,
          { role: "user", content: value, createdAt: Date.now() },
          { role: "assistant", content: generated.reply, createdAt: Date.now() + 1 },
        ],
        updatedAt: Date.now(),
      });
      setPrompt("");
      toast({
        title: generated.usedFallback ? "Updated locally" : "Gemini updated website",
        description: `${getTokenState().remaining} tokens remaining today.`,
      });
    } catch (error: any) {
      toast({ title: "Gemini failed", description: error?.message || "Could not generate website.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const save = () => {
    updateApp({ ...app, updatedAt: Date.now() });
    toast({ title: "Saved", description: "Project saved in All apps and Recents." });
  };

  const remove = () => {
    saveApps(getApps().filter(item => item.id !== id));
    toast({ title: "Deleted", description: `"${app.name}" was removed.` });
    navigate("/");
  };

  const downloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.replaceAll("/", "-");
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadProject = () => {
    const bundle = Object.entries(files).map(([name, content]) => `// FILE: ${name}\n${content}`).join("\n\n");
    downloadFile(`${app.name.replace(/\s+/g, "-").toLowerCase()}-code.txt`, bundle);
  };

  const openPreview = () => {
    const nextWindow = window.open("", "_blank");
    if (!nextWindow) {
      toast({ title: "Popup blocked", description: "Browser ne preview tab block kar diya." });
      return;
    }
    nextWindow.document.open();
    nextWindow.document.write(preview);
    nextWindow.document.close();
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f7f5f0] text-foreground">
      <header className="flex h-12 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-semibold leading-tight">{app.name}</p>
            <p className="text-[11px] text-muted-foreground">Saved at {new Date(app.updatedAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={mode === "preview" ? "default" : "outline"} size="sm" className="h-8" onClick={openPreview}>
            <Eye className="mr-1.5 h-4 w-4" /> Preview
          </Button>
          <Button variant={mode === "code" ? "default" : "outline"} size="sm" className="h-8" onClick={() => setMode("code")}>
            <Code2 className="mr-1.5 h-4 w-4" /> Code
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setMode("preview")}>
            <ExternalLink className="mr-1.5 h-4 w-4" /> Canvas
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toggleFavorite(id)}>
            <Star className={cn("h-4 w-4", isFav && "fill-current text-amber-500")} />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={downloadProject}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" onClick={save}>
            <Save className="mr-1.5 h-4 w-4" /> Save
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className={cn("grid h-[calc(100vh-48px)]", mode === "preview" ? "grid-cols-[320px_minmax(0,1fr)]" : "grid-cols-[320px_minmax(0,1fr)_340px]")}>
        <aside className="flex min-h-0 flex-col border-r border-border bg-[#f4f0e9]">
          <div className="border-b border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bot className="h-4 w-4" /> AI Agent
              </div>
              <span className="rounded-full bg-card px-2 py-1 text-[11px] font-medium">{tokens.remaining}/20 tokens</span>
            </div>
            <select
              value={model}
              onChange={event => setModel(event.target.value)}
              className="mb-3 h-9 w-full rounded-lg border border-border bg-card px-3 text-xs"
            >
              {GEMINI_MODEL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <p className="text-xs leading-5 text-muted-foreground">
              Gemini agent active hai. Chat se website, code files, preview aur Supabase-ready structure update hoga.
            </p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.createdAt}-${index}`} className={cn("rounded-2xl p-3 text-sm leading-6 shadow-soft", message.role === "user" ? "bg-card" : "bg-[#ebe7df]")}>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  {message.role === "user" ? <MessageSquare className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  {message.role === "user" ? "You" : "AI Agent"}
                </div>
                {message.content}
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
              }}
              placeholder="Describe changes: colors, sections, app logic, Supabase data..."
              className="min-h-[88px] resize-none bg-card"
            />
            <Button className="mt-2 w-full" onClick={generate} disabled={generating || !prompt.trim()}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Generate update
            </Button>
          </div>
        </aside>

        <section className={cn("min-w-0 overflow-auto bg-card", mode === "preview" ? "p-3" : "p-5")}>
          <div className="mb-3 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full bg-[#f4f0e9] px-4 py-2 text-sm font-medium shadow-soft">
              <RefreshCw className="h-4 w-4" /> {generating ? "Getting ready..." : "Preview ready"}
            </div>
          </div>
          {mode === "preview" ? (
            <div className="mx-auto h-[calc(100vh-112px)] w-full max-w-[1440px] overflow-hidden rounded-2xl border border-border bg-white shadow-elegant">
              <iframe title="Website preview" srcDoc={preview} sandbox="allow-scripts" className="h-full w-full bg-white" />
            </div>
          ) : (
            <pre className="mx-auto h-[calc(100vh-125px)] max-w-5xl overflow-auto rounded-2xl border border-border bg-[#111] p-5 text-xs leading-6 text-[#e8e8e8] shadow-elegant">
              {files[activeFile] ?? ""}
            </pre>
          )}
        </section>

        {mode === "code" && <aside className="min-h-0 border-l border-border bg-card">
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileCode2 className="h-4 w-4" /> Files
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid h-[calc(100%-48px)] grid-rows-[auto_1fr]">
            <div className="space-y-1 border-b border-border p-3">
              {fileNames.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    setActiveFile(name);
                    setMode("code");
                  }}
                  className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent", activeFile === name && "bg-accent")}
                >
                  <span className="truncate">{name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={event => {
                      event.stopPropagation();
                      downloadFile(name, files[name]);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </button>
              ))}
            </div>
            <div className="overflow-auto p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Selected file</p>
              <pre className="max-h-full whitespace-pre-wrap break-words rounded-xl bg-secondary/60 p-3 text-[11px] leading-5">
                {files[activeFile] ?? ""}
              </pre>
            </div>
          </div>
        </aside>}
      </main>
    </div>
  );
};

const AppDetails = () => (
  <ThemeProvider>
    <AppDetailsInner />
  </ThemeProvider>
);

export default AppDetails;
