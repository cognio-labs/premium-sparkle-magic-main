export type BuilderType = "component" | "page" | "hook" | "endpoint";

export type GeneratedFile = {
  name: string;
  path: string;
  timestamp: number;
  size: number;
  updatedAt: string;
};

export type GenerateResponse = {
  success: boolean;
  fileName: string;
  filePath: string;
  code: string;
  preview: string | null;
  usedFallback?: boolean;
};

const endpointByType: Record<BuilderType, string> = {
  component: "/api/generate",
  page: "/api/generate-full-page",
  hook: "/api/generate-hook",
  endpoint: "/api/generate-api-endpoint",
};

export async function generateWithClaude(prompt: string, type: BuilderType) {
  const response = await fetch(endpointByType[type], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, type }),
  });

  return readJson<GenerateResponse>(response);
}

export async function listBuilderFiles() {
  const response = await fetch("/api/files");
  return readJson<{ success: boolean; files: GeneratedFile[] }>(response);
}

export async function readBuilderFile(fileName: string) {
  const response = await fetch(`/api/files/${encodeURIComponent(fileName)}`);
  return readJson<{ success: boolean; fileName: string; content: string }>(response);
}

export async function deleteBuilderFile(fileName: string) {
  const response = await fetch(`/api/files/${encodeURIComponent(fileName)}`, { method: "DELETE" });
  return readJson<{ success: boolean; message: string }>(response);
}

export async function executeBuilderFile(fileName: string) {
  const response = await fetch("/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });
  return readJson<{ success: boolean; code?: number; output?: string; error?: string }>(response);
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data?.error || `Request failed with ${response.status}`);
  }
  return data as T;
}
