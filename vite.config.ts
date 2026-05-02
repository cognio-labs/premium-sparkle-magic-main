import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { callGemini } from "./api/gemini";
import {
  deleteGeneratedFile,
  executeGeneratedFile,
  generateCode,
  generatedPreviewHtml,
  listGeneratedFiles,
  readGeneratedFile,
  sendJson,
} from "./api/llm";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), llmDevApi(env.ANTHROPIC_API_KEY), geminiDevApi(env.GEMINI_API_KEY), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});

function llmDevApi(apiKey?: string): Plugin {
  return {
    name: "llm-builder-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");

        if (req.method === "GET" && url.pathname.startsWith("/generated/")) {
          try {
            const fileName = decodeURIComponent(url.pathname.replace("/generated/", ""));
            const file = readGeneratedFile(fileName);
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(file.content);
          } catch (error: any) {
            sendJson(res, error?.status || 500, { error: error?.message || "File read failed" });
          }
          return;
        }

        if (req.method === "GET" && url.pathname.startsWith("/api/preview/")) {
          try {
            const fileName = decodeURIComponent(url.pathname.replace("/api/preview/", ""));
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(generatedPreviewHtml(fileName));
          } catch (error: any) {
            sendJson(res, error?.status || 500, { error: error?.message || "Preview failed" });
          }
          return;
        }

        if (url.pathname === "/api/files" && req.method === "GET") {
          sendJson(res, 200, listGeneratedFiles());
          return;
        }

        if (url.pathname.startsWith("/api/files/")) {
          const fileName = decodeURIComponent(url.pathname.replace("/api/files/", ""));
          try {
            if (req.method === "GET") {
              sendJson(res, 200, readGeneratedFile(fileName));
              return;
            }
            if (req.method === "DELETE") {
              sendJson(res, 200, deleteGeneratedFile(fileName));
              return;
            }
          } catch (error: any) {
            sendJson(res, error?.status || 500, { error: error?.message || "File operation failed" });
            return;
          }
        }

        if (
          req.method === "POST" &&
          ["/api/generate", "/api/generate-full-page", "/api/generate-hook", "/api/generate-api-endpoint"].includes(url.pathname)
        ) {
          try {
            const body = JSON.parse(await readBody(req) || "{}");
            const type =
              url.pathname === "/api/generate-full-page" ? "page" :
              url.pathname === "/api/generate-hook" ? "hook" :
              url.pathname === "/api/generate-api-endpoint" ? "endpoint" :
              body.type;
            sendJson(res, 200, await generateCode({ ...body, type }, apiKey));
          } catch (error: any) {
            sendJson(res, error?.status || 500, { error: error?.message || "Generation failed" });
          }
          return;
        }

        if (url.pathname === "/api/execute" && req.method === "POST") {
          try {
            const body = JSON.parse(await readBody(req) || "{}");
            if (!body.fileName) throw new Error("fileName is required");
            sendJson(res, 200, await executeGeneratedFile(body.fileName));
          } catch (error: any) {
            sendJson(res, error?.status || 500, { error: error?.message || "Execution failed" });
          }
          return;
        }

        if (url.pathname === "/health" && req.method === "GET") {
          sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() });
          return;
        }

        next();
      });
    },
  };
}

function geminiDevApi(apiKey?: string): Plugin {
  return {
    name: "gemini-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/gemini", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
          const body = await readBody(req);
          const result = await callGemini(apiKey, JSON.parse(body || "{}"));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error?.message || "Gemini generation failed" }));
        }
      });
    },
  };
}

function readBody(req: any) {
  return new Promise<string>((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}
