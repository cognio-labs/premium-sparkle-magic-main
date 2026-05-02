import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Code2,
  Copy,
  Eye,
  FileCode2,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deleteBuilderFile,
  executeBuilderFile,
  generateWithClaude,
  listBuilderFiles,
  readBuilderFile,
  type BuilderType,
  type GeneratedFile,
} from "@/lib/llmBuilder";
import { promptCategories, promptTemplates } from "@/lib/promptLibrary";
import { cn } from "@/lib/utils";

const builderTypes: { value: BuilderType; label: string; hint: string }[] = [
  { value: "component", label: "Component", hint: "Reusable React TSX" },
  { value: "page", label: "Full Page", hint: "Complete layout" },
  { value: "hook", label: "Hook", hint: "Reusable logic" },
  { value: "endpoint", label: "API", hint: "Express endpoint" },
];

const starterPrompt = "Create a responsive pricing component with three plans, monthly/yearly toggle, popular badge, and accessible buttons.";

const BuilderInner = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(starterPrompt);
  const [type, setType] = useState<BuilderType>("component");
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [promptSearch, setPromptSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const previewUrl = useMemo(() => {
    if (!activeFile || !/\.(tsx|jsx)$/i.test(activeFile)) return "";
    return `/api/preview/${encodeURIComponent(activeFile)}`;
  }, [activeFile]);

  const filteredPrompts = useMemo(() => {
    const query = promptSearch.trim().toLowerCase();
    return promptTemplates.filter(item => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesQuery = !query || `${item.title} ${item.prompt} ${item.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, promptSearch]);

  const refreshFiles = async () => {
    setFilesLoading(true);
    try {
      const result = await listBuilderFiles();
      setFiles(result.files);
      if (!activeFile && result.files[0]) {
        await loadFile(result.files[0].name);
      }
    } catch (error: any) {
      toast({ title: "Files load failed", description: error?.message, variant: "destructive" });
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const generate = async () => {
    const value = prompt.trim();
    if (!value) return;
    setLoading(true);
    setOutput("");
    try {
      const result = await generateWithClaude(value, type);
      setActiveFile(result.fileName);
      setCode(result.code);
      await refreshFiles();
      toast({
        title: result.usedFallback ? "Local fallback generated" : "Claude generated code",
        description: result.fileName,
      });
    } catch (error: any) {
      toast({ title: "Generate failed", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (fileName: string) => {
    try {
      const result = await readBuilderFile(fileName);
      setActiveFile(fileName);
      setCode(result.content);
      setOutput("");
    } catch (error: any) {
      toast({ title: "File open failed", description: error?.message, variant: "destructive" });
    }
  };

  const removeFile = async (fileName: string) => {
    try {
      await deleteBuilderFile(fileName);
      if (activeFile === fileName) {
        setActiveFile("");
        setCode("");
      }
      await refreshFiles();
      toast({ title: "File deleted", description: fileName });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error?.message, variant: "destructive" });
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast({ title: "Code copied" });
  };

  const runFile = async () => {
    if (!activeFile) return;
    setOutput("Running...");
    try {
      const result = await executeBuilderFile(activeFile);
      setOutput([result.output, result.error].filter(Boolean).join("\n") || `Exited with code ${result.code ?? 0}`);
    } catch (error: any) {
      setOutput(error?.message || "Execution failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-base font-semibold">LLM Builder</h1>
            <p className="text-xs text-muted-foreground">Claude API, generated file storage, live preview, and execution tools.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refreshFiles} disabled={filesLoading}>
          {filesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </header>

      <main className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_300px]">
        <aside className="border-r border-border bg-[#f4f0e9] p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {builderTypes.map(item => (
                <button
                  key={item.value}
                  onClick={() => setType(item.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    type === item.value ? "border-primary bg-card shadow-soft" : "border-border bg-card/60 hover:bg-card"
                  )}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{item.hint}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                onKeyDown={event => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") generate();
                }}
                className="min-h-[190px] resize-none bg-card"
              />
            </div>

            <Button className="w-full" onClick={generate} disabled={loading || !prompt.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Generate
            </Button>

            <div className="rounded-lg border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
              Add <span className="font-semibold text-foreground">ANTHROPIC_API_KEY</span> in .env for Claude. Without it, local fallback code is generated so the UI still works.
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-3">
              <div>
                <h2 className="text-sm font-semibold">Prompt map</h2>
                <p className="text-xs text-muted-foreground">Search and insert reusable AI prompts.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={promptSearch}
                  onChange={event => setPromptSearch(event.target.value)}
                  placeholder="Search prompts"
                  className="h-9 pl-9"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", ...promptCategories].map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium",
                      activeCategory === category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/60 hover:bg-secondary"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredPrompts.slice(0, 30).map(item => (
                  <button
                    key={`${item.category}-${item.title}`}
                    onClick={() => setPrompt(item.prompt)}
                    className="w-full rounded-md border border-border bg-background p-2 text-left transition-colors hover:bg-secondary/70"
                  >
                    <p className="text-xs font-semibold">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{item.prompt}</p>
                  </button>
                ))}
                {filteredPrompts.length === 0 && (
                  <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    No prompt found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileCode2 className="h-4 w-4 text-muted-foreground" />
              <Input value={activeFile || "No file selected"} readOnly className="h-9 w-[min(420px,70vw)] bg-secondary/60" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyCode} disabled={!code}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={runFile} disabled={!activeFile}>
                <Play className="mr-2 h-4 w-4" /> Execute
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="min-h-[620px] overflow-hidden rounded-lg border border-border bg-[#111]">
              <div className="flex h-10 items-center gap-2 border-b border-white/10 px-3 text-xs font-medium text-white/70">
                <Code2 className="h-4 w-4" /> Code editor
              </div>
              <Textarea
                value={code}
                onChange={event => setCode(event.target.value)}
                spellCheck={false}
                className="h-[580px] resize-none rounded-none border-0 bg-[#111] font-mono text-xs leading-5 text-[#e8e8e8] shadow-none focus-visible:ring-0"
                placeholder="Generated code will appear here..."
              />
            </div>

            <div className="min-h-[620px] overflow-hidden rounded-lg border border-border bg-white">
              <div className="flex h-10 items-center gap-2 border-b border-border bg-card px-3 text-xs font-medium">
                <Eye className="h-4 w-4" /> Live preview
              </div>
              {previewUrl ? (
                <iframe key={previewUrl} title="Generated preview" src={previewUrl} sandbox="allow-scripts" className="h-[580px] w-full bg-white" />
              ) : (
                <div className="flex h-[580px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  TSX/JSX component ya page select karne par preview yahan dikhega.
                </div>
              )}
            </div>
          </div>

          {output && (
            <pre className="mt-4 max-h-44 overflow-auto rounded-lg border border-border bg-secondary/60 p-3 text-xs leading-5">
              {output}
            </pre>
          )}
        </section>

        <aside className="border-l border-border bg-[#f4f0e9] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Generated files</h2>
            <span className="text-xs text-muted-foreground">{files.length}</span>
          </div>
          <div className="space-y-1">
            {files.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                No generated files yet.
              </div>
            ) : files.map(file => (
              <div key={file.name} className={cn("group flex items-center gap-2 rounded-lg border p-2", activeFile === file.name ? "border-primary bg-card" : "border-transparent hover:bg-card/80")}>
                <button onClick={() => loadFile(file.name)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                </button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100" onClick={() => removeFile(file.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

const Builder = () => (
  <ThemeProvider>
    <BuilderInner />
  </ThemeProvider>
);

export default Builder;
