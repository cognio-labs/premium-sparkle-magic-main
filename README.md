# Lovable LLM Builder

React + Vite app with a Lovable-style dashboard, Gemini project generation, and a Claude-ready LLM builder.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:8080`.

## LLM Builder

Go to `/builder` from the dashboard header.

Local dev endpoints are mounted by Vite:

- `POST /api/generate`
- `POST /api/generate-full-page`
- `POST /api/generate-hook`
- `POST /api/generate-api-endpoint`
- `GET /api/files`
- `GET /api/files/:fileName`
- `DELETE /api/files/:fileName`
- `POST /api/execute`
- `GET /api/preview/:fileName`
- `GET /health`

Add this to `.env` for Claude generation:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Without `ANTHROPIC_API_KEY`, the builder uses a local fallback so the UI, file saving, and preview flow still work.

## Optional Standalone Backend

```bash
npm run server:dev
```

This starts `backend/server.ts` on `http://localhost:3001` with the same LLM/file endpoints.
