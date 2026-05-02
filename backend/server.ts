import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import {
  deleteGeneratedFile,
  executeGeneratedFile,
  generateCode,
  generatedPreviewHtml,
  GENERATED_DIR,
  listGeneratedFiles,
  readGeneratedFile,
} from "../api/llm";
import { callGemini } from "../api/gemini";
import { generateProjectFiles } from "../src/lib/store";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/gemini", async (req: Request, res: Response) => {
  await handle(res, async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return localWebsiteFallback(req.body, "Gemini API key is not configured.");
    }

    try {
      return await callGemini(apiKey, req.body ?? {});
    } catch {
      return localWebsiteFallback(req.body, "Gemini is unavailable right now.");
    }
  });
});

app.post("/api/generate", async (req: Request, res: Response) => {
  await handle(res, async () => generateCode({ prompt: req.body.prompt, type: req.body.type || "component" }));
});

app.post("/api/generate-full-page", async (req: Request, res: Response) => {
  await handle(res, async () => generateCode({ prompt: req.body.prompt, type: "page" }));
});

app.post("/api/generate-hook", async (req: Request, res: Response) => {
  await handle(res, async () => generateCode({ prompt: req.body.prompt, type: "hook" }));
});

app.post("/api/generate-api-endpoint", async (req: Request, res: Response) => {
  await handle(res, async () => generateCode({ prompt: req.body.prompt, type: "endpoint" }));
});

app.get("/api/files", (_req: Request, res: Response) => {
  handleSync(res, () => listGeneratedFiles());
});

app.get("/api/files/:fileName", (req: Request, res: Response) => {
  handleSync(res, () => readGeneratedFile(req.params.fileName));
});

app.delete("/api/files/:fileName", (req: Request, res: Response) => {
  handleSync(res, () => deleteGeneratedFile(req.params.fileName));
});

app.post("/api/execute", async (req: Request, res: Response) => {
  await handle(res, async () => executeGeneratedFile(req.body.fileName));
});

app.get("/api/preview/:fileName", (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(generatedPreviewHtml(req.params.fileName));
  } catch (error: any) {
    res.status(error?.status || 500).json({ error: error?.message || "Preview failed" });
  }
});

app.get("/generated/:fileName", (req: Request, res: Response) => {
  handleSync(res, () => readGeneratedFile(req.params.fileName));
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    backend: "express",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("Lovable LLM Backend Server Running");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log(`Generated files: ${GENERATED_DIR}`);
  console.log("");
});

async function handle(res: Response, fn: () => Promise<unknown>) {
  try {
    res.json(await fn());
  } catch (error: any) {
    res.status(error?.status || 500).json({ error: error?.message || "Unknown error" });
  }
}

function handleSync(res: Response, fn: () => unknown) {
  try {
    res.json(fn());
  } catch (error: any) {
    res.status(error?.status || 500).json({ error: error?.message || "Unknown error" });
  }
}

function withStatus(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function localWebsiteFallback(payload: any, reason: string) {
  const appName = payload?.appName || "Website Draft";
  const prompt = payload?.prompt || "Create a professional responsive website";
  const fallback = generateProjectFiles(prompt, appName);

  return {
    ...fallback,
    name: appName,
    reply: "Website draft ready. I created a complete responsive layout with sections, animations, CTA, contact form, and editable project files.",
    tags: ["website", "local-draft"],
    usedFallback: true,
    fallbackReason: reason,
  };
}
