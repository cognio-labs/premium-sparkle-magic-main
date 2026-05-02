import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export type GenerateKind = "component" | "page" | "hook" | "endpoint";

export type GeneratePayload = {
  prompt?: string;
  type?: GenerateKind;
};

export const GENERATED_DIR = path.join(process.cwd(), "generated");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const fileConfig: Record<GenerateKind, { prefix: string; ext: string; maxTokens: number; system: string }> = {
  component: {
    prefix: "component",
    ext: "tsx",
    maxTokens: 3000,
    system: `You are an expert React component generator.
Create production-ready React components using TypeScript and Tailwind CSS.

Requirements:
- Export one default React component.
- Use strong TypeScript types and interfaces.
- Use Tailwind CSS classes only.
- Make the UI responsive and accessible.
- Include loading, empty, and error states when relevant.
- Do not use markdown or explanations. Return only valid TSX.`,
  },
  page: {
    prefix: "page",
    ext: "tsx",
    maxTokens: 4000,
    system: `You are an expert React page generator.
Create a complete production-ready React page using TypeScript and Tailwind CSS.

Requirements:
- Export one default React page component.
- Use semantic HTML and accessible controls.
- Include responsive layout for mobile, tablet, and desktop.
- Include realistic state and polished empty/loading/error states.
- Do not use markdown or explanations. Return only valid TSX.`,
  },
  hook: {
    prefix: "hook",
    ext: "ts",
    maxTokens: 2000,
    system: `You are an expert React hook generator.
Create one reusable custom React hook using TypeScript.

Requirements:
- Use React hooks correctly with dependency arrays.
- Include typed params and return values.
- Include error handling where useful.
- Avoid external dependencies.
- Do not use markdown or explanations. Return only valid TypeScript.`,
  },
  endpoint: {
    prefix: "endpoint",
    ext: "ts",
    maxTokens: 2500,
    system: `You are an expert Node.js and Express API developer.
Generate a production-ready Express endpoint module using TypeScript.

Requirements:
- Include request and response typing.
- Validate input and return proper HTTP status codes.
- Use try/catch error handling.
- Follow security best practices.
- Do not use markdown or explanations. Return only valid TypeScript.`,
  },
};

export function ensureGeneratedDir() {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }
}

export async function generateCode(payload: GeneratePayload, apiKey = process.env.ANTHROPIC_API_KEY) {
  const prompt = payload.prompt?.trim();
  if (!prompt) throw httpError(400, "Prompt is required");

  const kind = normalizeKind(payload.type);
  const config = fileConfig[kind];
  let usedFallback = !apiKey;
  let fallbackReason = apiKey ? "" : "Missing ANTHROPIC_API_KEY";
  let code = "";

  if (apiKey) {
    try {
      code = await callAnthropic(apiKey, prompt, config.system, config.maxTokens);
    } catch (error) {
      usedFallback = true;
      fallbackReason = error instanceof Error ? error.message : "Claude API failed";
      code = localFallback(prompt, kind);
    }
  } else {
    code = localFallback(prompt, kind);
  }

  const cleanCode = cleanModelCode(code);
  const fileName = `${config.prefix}_${Date.now()}.${config.ext}`;

  ensureGeneratedDir();
  fs.writeFileSync(resolveGeneratedPath(fileName), cleanCode, "utf-8");

  return {
    success: true,
    fileName,
    filePath: `/generated/${fileName}`,
    code: cleanCode,
    preview: kind === "component" || kind === "page" ? `/api/preview/${fileName}` : null,
    usedFallback,
    fallbackReason: usedFallback ? fallbackReason : null,
  };
}

export function listGeneratedFiles() {
  ensureGeneratedDir();
  const files = fs
    .readdirSync(GENERATED_DIR)
    .filter(file => /\.(tsx|ts|jsx|js|mjs|cjs)$/i.test(file))
    .map(file => {
      const filePath = resolveGeneratedPath(file);
      const stat = fs.statSync(filePath);
      return {
        name: file,
        path: `/generated/${file}`,
        timestamp: Number(file.match(/\d+/)?.[0] || stat.mtimeMs),
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return { success: true, files };
}

export function readGeneratedFile(fileName: string) {
  const filePath = resolveGeneratedPath(fileName);
  if (!fs.existsSync(filePath)) throw httpError(404, "File not found");
  return { success: true, fileName, content: fs.readFileSync(filePath, "utf-8") };
}

export function deleteGeneratedFile(fileName: string) {
  const filePath = resolveGeneratedPath(fileName);
  if (!fs.existsSync(filePath)) throw httpError(404, "File not found");
  fs.unlinkSync(filePath);
  return { success: true, message: `Deleted ${fileName}` };
}

export function executeGeneratedFile(fileName: string) {
  const filePath = resolveGeneratedPath(fileName);
  if (!fs.existsSync(filePath)) throw httpError(404, "File not found");
  if (!/\.(js|mjs|cjs)$/i.test(fileName)) {
    throw httpError(400, "Only JavaScript files can be executed directly. TS/TSX files are available for preview and download.");
  }

  return new Promise(resolve => {
    let output = "";
    let error = "";
    const child = spawn(process.execPath, [filePath], {
      cwd: GENERATED_DIR,
      timeout: 5000,
      windowsHide: true,
      env: { NODE_ENV: "test" },
    });

    child.stdout.on("data", data => { output += data.toString(); });
    child.stderr.on("data", data => { error += data.toString(); });
    child.on("close", code => resolve({ success: code === 0, code, output, error }));
    child.on("error", err => resolve({ success: false, code: 1, output, error: err.message }));
  });
}

export function generatedPreviewHtml(fileName: string) {
  const { content } = readGeneratedFile(fileName);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>body{margin:0;font-family:Inter,system-ui,sans-serif;background:#fff;color:#111827}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-presets="typescript,react">
${prepareTsxForBrowser(content)}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(GeneratedComponent));
    </script>
  </body>
</html>`;
}

export function resolveGeneratedPath(fileName: string) {
  ensureGeneratedDir();
  const safeName = path.basename(fileName);
  const resolved = path.resolve(GENERATED_DIR, safeName);
  const generatedRoot = path.resolve(GENERATED_DIR);
  if (resolved !== path.join(generatedRoot, safeName) || !resolved.startsWith(generatedRoot + path.sep)) {
    throw httpError(403, "Access denied");
  }
  return resolved;
}

export function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export function sendJson(res: any, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function callAnthropic(apiKey: string, prompt: string, system: string, maxTokens: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw httpError(response.status, `Claude API failed (${response.status}): ${text || response.statusText}`);
  }

  const data = await response.json();
  return data?.content?.find((part: any) => part?.type === "text")?.text || "";
}

function cleanModelCode(code: string) {
  return code
    .replace(/^```(?:tsx|ts|jsx|js)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeKind(value?: GenerateKind): GenerateKind {
  if (value === "page" || value === "hook" || value === "endpoint") return value;
  return "component";
}

function prepareTsxForBrowser(code: string) {
  return cleanModelCode(code)
    .replace(/import\s+[^;]+;?/g, "")
    .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, "function $1")
    .replace(/export\s+default\s+([A-Za-z0-9_]+);?/, "const GeneratedComponent = $1;")
    .replace(/function\s+([A-Za-z0-9_]+)\s*\(/, "function GeneratedComponent(");
}

function localFallback(prompt: string, kind: GenerateKind) {
  const title = prompt.replace(/[^\w\s-]/g, " ").trim().split(/\s+/).slice(0, 4).join(" ") || "Generated UI";
  if (kind === "hook") {
    return `import { useCallback, useState } from "react";

export function useGeneratedAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await task();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
}
`;
  }

  if (kind === "endpoint") {
    return `import type { Request, Response } from "express";

export async function generatedEndpoint(req: Request, res: Response) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!req.body) return res.status(400).json({ error: "Request body is required" });
    return res.status(200).json({ success: true, data: req.body });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}
`;
  }

  return `type Feature = {
  label: string;
  value: string;
};

const features: Feature[] = [
  { label: "Frontend", value: "React + Tailwind" },
  { label: "Backend", value: "Claude API ready" },
  { label: "Preview", value: "Live iframe output" },
];

export default function GeneratedComponent() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Local fallback preview</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal md:text-6xl">${title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">${prompt}</p>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {features.map(feature => (
            <article key={feature.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{feature.label}</p>
              <p className="mt-2 text-lg font-semibold">{feature.value}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
`;
}
