# Lovable LLM Builder

React + Vite app with a Lovable-style dashboard, Gemini project generation, and a Claude-ready LLM builder.

## Run

```bash
npm install
npm run dev
```

This starts both servers:

- Express backend: `http://localhost:3001`
- Vite frontend: `http://localhost:8080`

Open `http://localhost:8080`.

## LLM Builder

Go to `/builder` from the dashboard header.

The builder includes a searchable prompt map with reusable prompts for system design, AI workflows, backend development, and coding/debugging. Selecting a prompt inserts it into the generator input.

## LLM Router

Website generation now runs through this backend pipeline:

```text
User Prompt -> LLM Router -> Gemini / OpenAI / Local LLM -> Local fallback -> Output
```

Configure provider order in `.env`:

```bash
LLM_PROVIDER_ORDER=gemini,openai,local-llm
GEMINI_API_KEY=your-google-ai-studio-key
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4.1-mini
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_MODEL=llama3.1
```

Router status:

```text
GET /api/llm/status
```

Generation route:

```text
POST /api/llm/route
```

The existing `POST /api/gemini` route still works, but it now uses the router internally.

Frontend requests are proxied to the Express backend:

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
