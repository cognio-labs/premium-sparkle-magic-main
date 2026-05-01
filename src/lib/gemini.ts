import { generateProjectFiles } from "@/lib/store";

type GenerateInput = {
  appName: string;
  prompt: string;
  files?: Record<string, string>;
};

export async function generateWebsiteWithGemini(input: GenerateInput) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const fallback = generateProjectFiles(input.prompt, input.appName);
    const message = await response.text().catch(() => "");
    return {
      ...fallback,
      name: input.appName,
      reply: `Gemini unavailable, local generator used. ${message}`,
      tags: ["website", "ai"],
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
