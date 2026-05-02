import { callGemini, type GeminiPayload, buildWebsitePrompt, WEBSITE_BUILDER_SYSTEM_PROMPT } from "./gemini";
import { generateProjectFiles } from "../src/lib/store";

type ProviderName = "gemini" | "openai" | "local-llm" | "local-fallback";

type RouterAttempt = {
  provider: ProviderName;
  ok: boolean;
  message: string;
};

type WebsiteGenerationResult = {
  name?: string;
  reply: string;
  tags: string[];
  preview: string;
  files: Record<string, string>;
  provider: ProviderName;
  usedFallback: boolean;
  attempts: RouterAttempt[];
};

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_LOCAL_MODEL = "gemma4";

export async function routeWebsiteGeneration(payload: GeminiPayload): Promise<WebsiteGenerationResult> {
  const attempts: RouterAttempt[] = [];
  const order = providerOrder();

  for (const provider of order) {
    try {
      if (provider === "gemini") {
        if (!process.env.GEMINI_API_KEY) {
          attempts.push({ provider, ok: false, message: "GEMINI_API_KEY not configured" });
          continue;
        }
        const result = await callGemini(process.env.GEMINI_API_KEY, payload);
        attempts.push({ provider, ok: true, message: "Generated with Gemini" });
        return normalizeResult(result, provider, attempts, false);
      }

      if (provider === "openai") {
        if (!process.env.OPENAI_API_KEY) {
          attempts.push({ provider, ok: false, message: "OPENAI_API_KEY not configured" });
          continue;
        }
        const result = await callOpenAI(payload);
        attempts.push({ provider, ok: true, message: "Generated with OpenAI" });
        return normalizeResult(result, provider, attempts, false);
      }

      if (provider === "local-llm") {
        if (!process.env.LOCAL_LLM_URL) {
          attempts.push({ provider, ok: false, message: "LOCAL_LLM_URL not configured" });
          continue;
        }
        const result = await callLocalLLM(payload);
        attempts.push({ provider, ok: true, message: "Generated with local LLM" });
        return normalizeResult(result, provider, attempts, false);
      }
    } catch (error) {
      attempts.push({
        provider,
        ok: false,
        message: error instanceof Error ? compactError(error.message) : "Provider failed",
      });
    }
  }

  const fallback = localWebsiteFallback(payload);
  attempts.push({ provider: "local-fallback", ok: true, message: "Generated with deterministic local fallback" });
  return { ...fallback, provider: "local-fallback", usedFallback: true, attempts };
}

export function routerStatus() {
  return {
    order: providerOrder(),
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      localLlm: Boolean(process.env.LOCAL_LLM_URL),
      localFallback: true,
    },
    models: {
      openai: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      localLlm: process.env.LOCAL_LLM_MODEL || DEFAULT_LOCAL_MODEL,
    },
  };
}

function providerOrder(): ProviderName[] {
  const raw = process.env.LLM_PROVIDER_ORDER || "gemini,openai,local-llm";
  const parsed = raw
    .split(",")
    .map(item => {
      const value = item.trim().toLowerCase();
      return value === "ollama" ? "local-llm" : value;
    })
    .filter((item): item is ProviderName => item === "gemini" || item === "openai" || item === "local-llm");
  return parsed.length ? parsed : ["gemini", "openai", "local-llm"];
}

async function callOpenAI(payload: GeminiPayload) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: WEBSITE_BUILDER_SYSTEM_PROMPT },
        { role: "user", content: buildWebsitePrompt(payload) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  }

  const data = await response.json();
  return parseProviderJson(data?.choices?.[0]?.message?.content || "", "OpenAI");
}

async function callLocalLLM(payload: GeminiPayload) {
  const baseUrl = process.env.LOCAL_LLM_URL?.replace(/\/$/, "");
  const useOllamaApi = process.env.LOCAL_LLM_PROVIDER === "ollama" || baseUrl?.includes(":11434");

  if (useOllamaApi) {
    return callOllama(payload, baseUrl || "http://localhost:11434");
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LOCAL_LLM_API_KEY ? { Authorization: `Bearer ${process.env.LOCAL_LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: process.env.LOCAL_LLM_MODEL || DEFAULT_LOCAL_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: WEBSITE_BUILDER_SYSTEM_PROMPT },
        { role: "user", content: buildWebsitePrompt(payload) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Local LLM failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  }

  const data = await response.json();
  return parseProviderJson(data?.choices?.[0]?.message?.content || "", "Local LLM");
}

async function callOllama(payload: GeminiPayload, baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.LOCAL_LLM_MODEL || DEFAULT_LOCAL_MODEL,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: WEBSITE_BUILDER_SYSTEM_PROMPT },
        { role: "user", content: buildWebsitePrompt(payload) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  }

  const data = await response.json();
  return parseProviderJson(data?.message?.content || "", "Ollama");
}

function parseProviderJson(text: string, label: string) {
  const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!clean) throw new Error(`${label} returned empty content`);
  const parsed = JSON.parse(clean);
  if (!parsed.files || typeof parsed.files !== "object") throw new Error(`${label} response did not include files`);
  if (!parsed.files["index.html"]) throw new Error(`${label} response did not include index.html`);

  return {
    name: parsed.name,
    reply: parsed.reply || "Website generated.",
    tags: Array.isArray(parsed.tags) ? parsed.tags : ["website", "ai"],
    preview: parsed.files["index.html"],
    files: parsed.files,
  };
}

function normalizeResult(result: any, provider: ProviderName, attempts: RouterAttempt[], usedFallback: boolean): WebsiteGenerationResult {
  return {
    name: result.name,
    reply: result.reply || "Website draft ready.",
    tags: Array.isArray(result.tags) ? result.tags : ["website", provider],
    preview: result.preview || result.files?.["index.html"],
    files: result.files,
    provider,
    usedFallback,
    attempts,
  };
}

function localWebsiteFallback(payload: GeminiPayload) {
  const appName = payload?.appName || "Website Draft";
  const prompt = payload?.prompt || "Create a professional responsive website";
  const fallback = generateProjectFiles(prompt, appName);

  return {
    ...fallback,
    name: appName,
    reply: "Website draft ready. I created a complete responsive layout with sections, animations, CTA, contact form, and editable project files.",
    tags: ["website", "local-draft"],
  };
}

function compactError(message: string) {
  return message
    .replace(/AIza[0-9A-Za-z_-]+/g, "[gemini-key]")
    .replace(/sk-[0-9A-Za-z_*.-]+/g, "[openai-key]")
    .replace(/\s+/g, " ")
    .slice(0, 260);
}
