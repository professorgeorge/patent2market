# Source and dependency register

## Original software

Patent2Market code, styling, and icon artwork: MIT. Runtime third-party npm dependencies: none. Bundled external fonts, tracking scripts, stock imagery, and AI models: none. Node.js is a development/test runtime, not bundled into the browser application.

## NASA technology metadata

Source: https://technology.nasa.gov/api/
Retrieved: 2026-11-14. Catalog queries and per-record source URLs are included in dist/catalog.json. HTML search highlighting is removed; titles and descriptions are attributed to NASA Technology Transfer. Images and NASA logos are not redistributed.

NASA material generally may be reproduced subject to its usage guidelines and any third-party notices. This is not a blanket license of every NASA-hosted item or underlying invention. Source guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/ . The source API expressly supports building integrations. Review new source content for item-specific restrictions before expanding ingestion. Do not represent this project as NASA-sponsored or endorsed.

Patent and licensing status are not inferred from public accessibility, federal origin, or nonprofit use. Users must verify applicability, current status, and necessary rights with authoritative sources. Hosting is infrastructure, separate from this independently deployable open-source application.

## Optional inference services and local model

OpenAI and Gemini are optional proprietary API services, not bundled software. OpenAI-compatible endpoints and Ollama can serve models under different licenses; review the chosen model separately.

The locally installed `qwen3.5:4b` model used for development reports Apache License 2.0, Copyright 2026 Alibaba Cloud, via Ollama `/api/show`. The upstream model repository also specifies Apache-2.0: https://huggingface.co/Qwen/Qwen3.5-4B . Its weights are not redistributed with Patent2Market. Using an openly licensed model does not guarantee the accuracy or rights status of its outputs.

## International patent references and optional Lens service

`dist/global-patents.json` contains original short paraphrases and factual identifiers for JP3731093B2 and CN201653084U, with individual Google Patents source links and review dates. It does not redistribute complete patent texts or drawings. Google Patents legal-status labels are assumptions, not official clearance. Full documents and translations remain at the source; their availability does not grant invention rights.

Lens API is an optional external data service requiring approved access under its own terms. API documentation: https://docs.api.lens.org/request-patent.html and https://docs.api.lens.org/response-patent.html . Provider access charges are separate from licensing costs for inventions. Do not redistribute retrieved datasets beyond the permission of the provider and underlying sources. No Lens token or harvested Lens dataset is bundled.
