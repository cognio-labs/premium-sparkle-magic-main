const GEMINI_MODEL = "gemini-2.5-flash";

type GeminiPayload = {
  appName?: string;
  prompt?: string;
  files?: Record<string, string>;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      return;
    }

    const payload = (req.body ?? {}) as GeminiPayload;
    const result = await callGemini(apiKey, payload);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Gemini generation failed" });
  }
}

export async function callGemini(apiKey: string, payload: GeminiPayload) {
  const prompt = buildPrompt(payload);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "You are a senior full-stack product engineer. Return only valid JSON. Do not wrap the JSON in markdown." }],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response");

  const parsed = JSON.parse(text);
  if (!parsed.files || typeof parsed.files !== "object") throw new Error("Gemini response did not include files");
  if (!parsed.files["index.html"]) throw new Error("Gemini response did not include index.html");

  return {
    name: parsed.name,
    reply: parsed.reply || "Website generated.",
    tags: Array.isArray(parsed.tags) ? parsed.tags : ["website", "ai"],
    preview: parsed.files["index.html"],
    files: parsed.files,
  };
}

function buildPrompt(payload: GeminiPayload) {
  return `Create or update a premium website/app project.

User request:
${payload.prompt || "Create a premium website"}

Project name:
${payload.appName || "Untitled"}

Required stack labels:
- UI: React (JS/TS)
- Logic: JavaScript / TypeScript
- Backend: Node.js / Supabase
- Styling: CSS / Tailwind

Existing files, if any:
${JSON.stringify(payload.files ?? {}, null, 2).slice(0, 20000)}

Return strict JSON with this exact shape:
{
  "name": "Short project name",
  "reply": "Brief chat response for the user",
  "tags": ["website", "ai"],
  "files": {
    "index.html": "Complete self-contained preview HTML with inline CSS and JS where useful",
    "package.json": "Valid package JSON string",
    "src/App.tsx": "React TypeScript app code",
    "src/main.tsx": "React entry file",
    "src/styles.css": "CSS or Tailwind-ready styles",
    "supabase/schema.sql": "Optional Supabase schema SQL",
    "README.md": "Setup notes"
  }
}

The index.html must render the actual preview immediately in an iframe without a build step. Use professional layout, real sections, buttons, responsive CSS, and no placeholder lorem ipsum.`;
}
