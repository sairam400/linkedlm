# LinkedLM

An AI-powered LinkedIn writing copilot prototype. It includes a polished responsive dashboard, topic inspiration, tone and goal controls, post generation, regeneration, a LinkedIn-style preview, quality scoring, and copy-to-clipboard.

## Quick start

```powershell
npm start
```

Then visit `http://localhost:4173`.

No dependencies are required. The included generator works locally without an API key.

## Enable live AI

Copy `.env.example` to `.env` and set `OPENAI_API_KEY` in your shell or hosting provider. The API key is read only by `server.js` and is never exposed to the browser. You can override the default model with `OPENAI_MODEL`.

PowerShell example for the current terminal:

```powershell
$env:OPENAI_API_KEY="your-key"
npm start
```

## Commands

- `npm start` — run the production server
- `npm run dev` — run with automatic restart
- `npm run check` — validate JavaScript syntax
- `npm test` — run tests

Health endpoint: `GET /api/health`

## Project structure

- `index.html`, `styles.css`, `app.js` — responsive browser UI
- `server.js` — static server and secure AI endpoint
- `marketing/` — LinkedIn launch graphics
