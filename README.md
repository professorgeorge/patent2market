# Patent2Market — Venture Studio

An open-source PWA for developing a business plan from a real problem, sourced technology and evidence. New projects start empty. No example projects, financial defaults or patent catalogs are bundled.

## Run

Requires Node.js 22.9+. No package installation is needed.

```sh
npm start
npm test
npm run check
npm run build
node scripts/check-worker.mjs
```

Open http://localhost:4173. The build produces `dist/server/index.js`, a portable Cloudflare Worker with embedded assets and API gateways. A static host can serve `dist/` assets without `dist/server/`; browser AI, direct Ollama and custom browser-accessible endpoints can work there, but the named cloud-provider and integrated patent gateways require the server.

The current hosted site remains owner-private. Before changing it to a public service, add authenticated access and distributed spending/quota controls. Same-origin checks and in-memory per-isolate throttles are not authentication.

## AI connection setup

Use **Connect AI**:

- **Ollama:** selecting it detects installed models through `/api/tags`. The local app uses a server bridge to avoid browser CORS restrictions. The hosted app checks your computer directly. Start Ollama and allow the exact site origin through `OLLAMA_ORIGINS`; browser local-network permissions may also be required. Detection lists installed model names and allows a choice; it does not install models or verify that each installed model is suitable for planning.
- **Browser-embedded AI:** availability is feature-detected through `LanguageModel`. **Prepare browser model** starts initialization/download with visible progress under a user gesture. Unsupported browsers display their status. Having a browser chat sidebar does not mean a website can access its model.
- **OpenAI, Anthropic, DeepSeek and Gemini:** enter your own API key and model identifier. Keys stay in page memory, are forwarded through the same-origin app gateway on each requested inference, and are not written to browser storage, project backups or server storage by application code. Reloading or disconnecting forgets them. Use only an app host you trust with credentials. Provider usage charges and data terms apply.
- **Other OpenAI-compatible API:** enter an HTTPS base URL, model and optional key. Requests go directly from the browser; the provider must allow this origin through CORS. Arbitrary user-supplied hosts are never proxied through the server.
- **Host-configured services:** configured providers also appear separately in the menu. Optional `.env` names are in `.env.example`; never commit secrets.

Host configuration supports `OPENAI_API_KEY/OPENAI_MODEL`, `ANTHROPIC_API_KEY/ANTHROPIC_MODEL`, `DEEPSEEK_API_KEY/DEEPSEEK_MODEL`, `GEMINI_API_KEY/GEMINI_MODEL`, `COMPATIBLE_BASE_URL/COMPATIBLE_MODEL/COMPATIBLE_API_KEY`, and local `OLLAMA_MODEL`. The loopback-only development server enables automatic local discovery; hosted Workers cannot discover your computer through their own loopback.

Protocols: [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create), [Anthropic Messages](https://platform.claude.com/docs/en/api/messages/create), [DeepSeek](https://api-docs.deepseek.com/quick_start/), [Ollama model discovery](https://docs.ollama.com/api/tags), and [browser Prompt API](https://developer.chrome.com/docs/ai/prompt-api). Models are user-selected; no example model identifiers or credentials are prefilled.

## Fresh patent sourcing

Choose a source in Technology before searching:

| Source | App behavior |
| --- | --- |
| Lens | Integrated worldwide search; approved session API token or server `LENS_API_TOKEN` required; first 30 provider matches |
| NASA Technology Transfer | Integrated live search; up to 50 technology summaries; these are not automatically treated as full patent documents |
| Google Patents | Opens a fresh external search using your query; add chosen documents manually |
| EPO Espacenet | Opens a fresh external search; add chosen documents manually |
| WIPO PATENTSCOPE | Opens the source search page; enter your query there and add chosen documents manually |
| My sourced documents | Works with documents you deliberately added or selected in your project |

No fallback examples or offline patent catalogs are loaded. Source switching clears the current search results; selected project documents remain yours. New searches replace the result list. Failed searches are reported. Search terms and any session access token are sent only to the chosen integrated source. API responses are not service-worker cached. Selected documents persist as part of your own project, not as a bundled corpus.

Full-document and documented expired/open-license filters are independent. Readable text is not invention-use permission. Lens full-text availability requires actual description and claims in its response. NASA summaries are hidden by the default full-document filter until a full source is documented. Source-reported status is not legal clearance. Record jurisdiction, checked date, rights evidence, relevant excerpts, and any published fee/royalty terms with a URL and date. Unknown cost never means zero; enter evidenced fees in the financial worksheet yourself.

Semi-autopilot clarifies the problem, searches the chosen integrated source (or uses your sourced documents), and proposes up to six complementary ingredients or a no-patent alternative. IDs and exact supporting passages are validated. It includes component roles, integration risks, other inputs, a first test and questions. You review before replacing the chosen technologies and concept. Grounding checks do not establish engineering compatibility or rights.

## Country-aware planning

Record operating country, registration country, state/province or local area, sector/intended use, cross-border activities and local conditions. Country review and plan generation require an operating country. Add official-source evidence with date and applicable jurisdiction using the **Country / regulatory requirement** evidence type.

AI guidance and the plan must relate design, operations, market access, supply chains, taxes/duties, permits, product standards, employment, privacy, environmental considerations and launch sequence to this context where relevant. Unsupported obligations, fees and rates are questions to verify, not asserted law. The app does not currently browse official regulatory sources automatically. Planning context is retained in project backups and appended to Markdown exports.

All financial inputs start blank. No projection is shown until currency and all required inputs are supplied. The worksheet models immediate cash payment, constant unit price/cost, monthly growth and +/-40% volume sensitivity. Taxes, financing, inventory timing and other omitted cash flows need separate assessment; country-dependent fees can be incorporated in cost inputs once evidenced. AI may not fill missing figures with sample numbers.

## Persistence and privacy

Project data is saved in local browser storage. Export JSON backups to preserve it. Existing user projects are retained on upgrade; use **My project → Start a new project** for an empty workspace. Connections and API keys are session-only and excluded from backups. No analytics are included. The service worker caches application assets only; activation removes earlier application caches containing the retired catalogs. Reload after an update to use the new UI. Offline access supports your saved project, not fresh searches or cloud inference.

The original explorer URL now links to the venture studio and cannot load an old catalog.

## Verification

49 automated tests cover empty defaults, calculations, source filters, project migration, country context, provider protocols, credential isolation, browser-model lifecycle, local discovery, source gateways and synthesis validation. Worker checks confirm retired catalog URLs return 404. Live checks detected four installed Ollama models and retrieved 48 current NASA records without storing a dataset.

Paid cloud-provider inference and live Lens access are not tested without credentials. Browser-model lifecycle uses an API mock; actual inference needs a supported browser/device. This update has no fresh visual browser pass because the computer-use session previously hit its usage limit. Earlier UI verification does not establish validation of these new controls.

## License and credit

Original software is MIT licensed with no third-party runtime packages. Optional data and model services have their own terms; see `THIRD_PARTY_NOTICES.md`. The application license does not license inventions.

Conceptualization and development: [Professor Babu George](https://www.linkedin.com/in/beingbabu/).
