# Patent2Market — Venture Studio

An install-optional PWA that takes a founder from a problem to an editable business-planning draft. Version 0.2 shifts the product toward practical venture development, with optional AI assistance throughout.

## Run and deploy

Requires Node.js 22.9+ (the development command uses `--env-file-if-exists`). No package installation is needed.

```sh
npm start
npm test
npm run check
npm run build
```

Open http://localhost:4173. `npm run build` generates `dist/server/index.js`, a portable Cloudflare Worker with embedded static assets and the AI gateway. The generated file is ignored by Git and rebuilt for deployment. Sites uses `.openai/hosting.json` and the generated Worker. Static-only hosting can serve the top-level `dist/` assets, excluding `dist/server/`; guided mode, browser AI, and browser-to-Ollama work without the gateway, but cloud AI does not.

The current hosted preview is owner-private. Keep cloud AI endpoints behind authenticated access. The gateway's same-origin checks and per-isolate throttling are defense-in-depth, not a substitute for authentication, distributed quotas, or abuse controls on a public site. Browser `Origin` headers are not credentials. A public launch needs a proper authenticated gateway and spending limits.

## The user journey

1. Describe a problem, paying customer, place, constraints, and founder advantages.
2. Search a 402-record NASA snapshot, choose a technology, or add a patent/open design from elsewhere.
3. Develop a concrete offer; optionally ask AI for three contrasting concepts and a simpler alternative.
4. Record dated source evidence, customer observations, costs, and competitive alternatives.
5. Adjust unit economics and inspect 12-month downside/base/upside scenarios.
6. Generate a 14-section business-plan draft, edit each section, download Markdown, or print/save PDF.

Projects autosave in browser storage. JSON backup/import moves an editable project between devices. The original explorer remains at `/explorer.html` and its existing local storage is preserved. Source descriptions, user inputs, AI hypotheses, and unverified access conditions are identified separately.

## AI connections

Cloud credentials are server-side only. Copy `.env.example` to `.env` for local development; never commit `.env`. For hosted deployment, set the equivalent environment variables using the hosting service's secret configuration.

| Provider | Configuration | Protocol |
| --- | --- | --- |
| Local server Ollama | `OLLAMA_MODEL` | Loopback `/api/chat`, server-side |
| OpenAI | `OPENAI_API_KEY`, `OPENAI_MODEL` | Responses API; `store:false` |
| Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` | `generateContent` with system instruction |
| OpenAI-compatible | `COMPATIBLE_BASE_URL`, `COMPATIBLE_MODEL`, optional `COMPATIBLE_API_KEY` | `/chat/completions`; base usually ends in `/v1` |
| Browser AI | Browser exposes `LanguageModel`; compatible device/model | Prompt API, feature-detected |
| Ollama | Installed local model and running Ollama | Browser POST to local `/api/chat` |

Models are explicitly configurable because availability and provider terms change. Cloud model names and keys are not bundled. Provider choices show whether a service is configured; no fake successful response is shown when it is unavailable. In the UI, choose **Connect AI**, select a connection, and review project-context sharing. Connection choices and consent are session-only.

For a locally running app, set `OLLAMA_MODEL` in `.env` to use the local server bridge without browser CORS changes. This workspace is configured for the already-installed `qwen3.5:4b`; no model weights are bundled. A deployed cloud server cannot access your computer’s loopback address.

For direct browser-to-Ollama, configure `OLLAMA_ORIGINS` to include the exact application origin (for example `http://localhost:4173`), restart Ollama if necessary, and enter the exact installed model name. Do not use a wildcard origin. The browser may require local-network permission; remote HTTPS pages may not reach loopback on all browsers. Use the local app or a server-configured compatible endpoint when browser policy prevents direct local access. Browser AI may need a substantial model download and is not available on all Chromium browsers or devices.

OpenAI/Gemini are optional proprietary services. The application is open-source; these services are not. Local model licenses must be reviewed independently. Inference may incur provider charges. The direct Ollama adapter was live-tested successfully with the already-installed `qwen3.5:4b` on synthetic opportunity-clarification and complete 14-section plan-generation tasks. OpenAI, Gemini, and generic compatible cloud adapters have protocol tests with mocked responses but no live paid-provider verification.

### Assistant tasks

Opportunity clarification, technical explanation, business-concept alternatives, evidence collection planning, skeptical review, and comprehensive plan writing. Prompts treat retrieved descriptions and notes as untrusted input. Outputs are escaped before display. Incomplete plan responses do not replace existing work. Users can cancel requests; cloud calls have bounded timeouts. Cancellation does not guarantee that the provider stops billing work already started.

This release does **not** perform live web research. The evidence assistant proposes questions and tests; users add actual source material. Patent discovery uses the dated snapshot plus external search links and manual imports. The application does **not** yet automatically verify expiration, patent families, jurisdiction-specific rights, or licensing conditions. A user-documented access basis is never represented as independent legal clearance.

## Financial model

Price and variable cost per unit, month-one volume, monthly volume growth, monthly fixed costs, upfront launch costs, and starting capital are explicit inputs. Annual revenue/profit, monthly cash balances, break-even volume, and maximum funding gap are calculated in code. Downside/upside multiply volume by 0.6/1.4. All scenarios assume immediate payment, fixed prices/costs, and the entered growth. Taxes, financing, depreciation, inventory timing, refunds, and capacity constraints are excluded. Defaults are illustrative and must be replaced with evidence.

## Architecture and verification

- `dist/venture.js`: guided UI, local persistence, evidence and plan editing.
- `dist/venture-core.js`: project validation, financial calculations, access labels, guided plans, export.
- `dist/core.js`: inspectable BM25-style lexical retrieval and original brief export.
- `dist/prompts.js`: stage-specific prompts and model-response validation.
- `dist/ai-client.js`: cloud, browser AI, and Ollama adapters.
- `server/ai.mjs`: server-side credential handling, model protocols, input/origin checks and throttling.
- `scripts/build-worker.mjs`: dependency-free deployment bundling.
- `test/`: retrieval, corpus integrity, calculations, imports, source URLs, AI protocols and gateway tests.

Manual browser verification covered a problem-to-plan journey, technology selection, evidence entry, scenario recalculation, plan editing, persistence after reload, unavailable-provider messaging, and offline access with the local server stopped. Paid cloud inference and actual browser-model inference remain unverified. Local Ollama opportunity clarification and complete 14-section plan generation were verified.

## Offline and privacy

The service worker caches the shell, original explorer, and catalog, never AI endpoints or responses. Increment its cache version when changing assets. An updated worker activates after installation; reload to use the new UI. Cloud AI needs a network connection. Offline guided planning requires the initial assets to have cached successfully. Browser storage is not encrypted or backed up; clear-site-data removes work. Download project backups regularly. No analytics or tracking SDKs are included.

## License and source terms

Original code is MIT licensed. No third-party runtime packages, fonts, or stock imagery are bundled. NASA metadata is separately attributed in `THIRD_PARTY_NOTICES.md`. The application license does not license inventions. Public availability, government origin, and nonprofit use do not establish freedom to practice a patent or eliminate liability.

## Credits

Conceptualization and development: [Professor Babu George](https://www.linkedin.com/in/beingbabu/).
