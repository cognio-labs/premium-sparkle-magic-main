import { generateProjectFiles } from "@/lib/store";

type GenerateInput = {
  appName: string;
  prompt: string;
  files?: Record<string, string>;
  model?: string;
};

export const GEMINI_MODEL_OPTIONS = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-pro-latest",
  "gemini-3.1-flash-lite-preview",
  "gemini-3-pro-preview",
];

export async function generateWebsiteWithGemini(input: GenerateInput) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const fallback = generateProjectFiles(input.prompt, input.appName);
    return {
      ...fallback,
      name: input.appName,
      reply: "AI provider unavailable, so I created a complete local website draft instead. Add a fresh Gemini API key to enable cloud generation.",
      tags: ["website", "local-draft"],
      usedFallback: true,
    };
  }

  return {
    ...(await response.json()),
    usedFallback: false,
  } as {
    name?: string;
    reply: string;
    tags: string[];
    preview: string;
    files: Record<string, string>;
    usedFallback: boolean;
  };
}
