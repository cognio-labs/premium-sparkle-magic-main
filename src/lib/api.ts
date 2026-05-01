import { getEndpoint } from "@/lib/store";

export type GenerateResult = {
  name: string;
  preview: string;
  tags?: string[];
};

export async function generateProject(prompt: string): Promise<GenerateResult> {
  const endpoint = getEndpoint();

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      return {
        name: data.name || derivedName(prompt),
        preview: data.preview || data.html || data.content || mockPreview(prompt),
        tags: data.tags || [],
      };
    } catch (e) {
      console.error("Generation API error:", e);
      throw e;
    }
  }

  // Fallback mock when no endpoint configured
  await new Promise(r => setTimeout(r, 800));
  return {
    name: derivedName(prompt),
    preview: mockPreview(prompt),
    tags: ["draft"],
  };
}

function derivedName(prompt: string): string {
  const words = prompt.trim().split(/\s+/).slice(0, 4).join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Untitled";
}

function mockPreview(prompt: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Preview</title>
  <style>
    body{margin:0;font-family:Inter,system-ui,sans-serif;background:linear-gradient(180deg,#fff5ec,#ffd6a5);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;color:#2a1810}
    .card{max-width:640px;background:rgba(255,255,255,.85);backdrop-filter:blur(12px);border-radius:24px;padding:2.5rem;box-shadow:0 20px 60px -20px rgba(180,80,20,.2);border:1px solid rgba(255,180,120,.4)}
    h1{font-family:'Instrument Serif',serif;font-size:2.75rem;margin:0 0 1rem;line-height:1.1}
    p{color:#6b5d54;line-height:1.6;margin:0 0 1.5rem}
    .pill{display:inline-block;padding:.4rem .9rem;background:linear-gradient(135deg,#ff8c42,#ff6b35);color:#fff;border-radius:999px;font-size:.8rem;font-weight:600}
  </style></head><body><div class="card">
  <span class="pill">Generated preview</span>
  <h1>Your project is ready</h1>
  <p>${escapeHtml(prompt).slice(0, 280) || "Describe your idea to see a live preview here."}</p>
  </div></body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
