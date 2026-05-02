export const GEMINI_MODELS = [
  "gemini-3-flash-preview",
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

type GeminiPayload = {
  appName?: string;
  prompt?: string;
  files?: Record<string, string>;
  model?: string;
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
  const models = preferredModels(payload.model);
  let lastError = "";

  for (const model of models) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: WEBSITE_BUILDER_SYSTEM_PROMPT }],
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
      lastError = `Gemini API failed (${response.status}) on ${model}: ${text}`;
      if (response.status === 404 || response.status === 503) continue;
      throw new Error(lastError);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text ?? "").join("").trim();
    if (!text) {
      lastError = `Gemini returned an empty response on ${model}`;
      continue;
    }

    const parsed = JSON.parse(text);
    if (!parsed.files || typeof parsed.files !== "object") throw new Error("Gemini response did not include files");
    if (!parsed.files["index.html"]) throw new Error("Gemini response did not include index.html");

    return {
      name: parsed.name,
      reply: `${parsed.reply || "Website generated."} (${model})`,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["website", "ai"],
      preview: parsed.files["index.html"],
      files: parsed.files,
    };
  }

  throw new Error(lastError || "Gemini generation failed");
}

function preferredModels(model?: string) {
  if (!model || !GEMINI_MODELS.includes(model)) return GEMINI_MODELS;
  return [model, ...GEMINI_MODELS.filter(item => item !== model)];
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

const WEBSITE_BUILDER_SYSTEM_PROMPT = `You are an expert full-stack website builder AI agent.
Transform client requirements into complete, production-ready websites.

Core mission:
- Create complete React/Tailwind-ready website projects.
- Include professional design systems, modern animations, interactive components, smooth transitions, accessibility, and perfect mobile responsiveness.
- Return only valid JSON. Do not wrap JSON in markdown.

Mandatory website sections unless the client explicitly says no:
1. Sticky responsive navigation with mobile-ready structure.
2. Eye-catching hero section with clear CTA.
3. Main content matching the client's business.
4. Features/services cards with hover effects.
5. Testimonials or trust section.
6. Conversion CTA section.
7. Contact, newsletter, or booking form.
8. Footer with links and copyright.

Animation and interaction requirements:
- Smooth scroll behavior.
- Fade-in or entrance animations.
- Hover effects on buttons, cards, and links.
- Smooth transitions between states.
- Form validation-ready markup and visible focus states.
- Counter/stat-style metric cards where relevant.

Technical standards:
- Clean React functional components with hooks where useful.
- Tailwind CSS style conventions in React files.
- Semantic HTML and ARIA labels.
- Mobile-first responsive layout.
- No broken imports or missing components.
- No placeholder lorem ipsum.

Industry styling:
- Tech/SaaS: blues, purples, minimal.
- Health/wellness: greens, teals, calm.
- Finance: blues, golds, secure.
- Creative/design: bold, expressive.
- Real estate: warm, premium.
- Fitness: energetic oranges and dark contrast.
- Fashion: minimalist black/gold/pink.
- Restaurant: warm appetizing colors.
- Education: blue/green knowledge-focused.
- Corporate/legal: blue/gray professional trust.

Output quality:
- JSON must include name, reply, tags, and files.
- files.index.html must be a complete self-contained preview.
- files["src/App.tsx"] must be usable React code.
- Copy must be business-specific and polished.`;
