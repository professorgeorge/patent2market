# Source and dependency register

## Original software

Patent2Market code, styling, and icon artwork: MIT. Runtime third-party npm dependencies: none. Bundled external fonts, tracking scripts, stock imagery, and AI models: none. Node.js is a development/test runtime, not bundled into the browser application.

## Live patent sources

NASA API: https://technology.nasa.gov/api/ . The app retrieves selected live results and attributes each to its source. No NASA metadata catalog, image or logo is bundled. Public access does not license underlying inventions, and NASA does not endorse this app.

Lens API: https://docs.api.lens.org/request-patent.html and https://docs.api.lens.org/response-patent.html . Optional approved API access is subject to the provider’s terms and any charges. No Lens dataset is bundled. External Google Patents, EPO Espacenet and WIPO PATENTSCOPE links are search handoffs; their terms apply on those sites.

## Optional inference services and local model

OpenAI, Anthropic, DeepSeek and Gemini are optional API services, not bundled software. OpenAI-compatible endpoints and Ollama can serve models under different licenses; review the chosen model separately.

The locally installed `qwen3.5:4b` model used for development reports Apache License 2.0, Copyright 2026 Alibaba Cloud, via Ollama `/api/show`. The upstream model repository also specifies Apache-2.0: https://huggingface.co/Qwen/Qwen3.5-4B . Its weights are not redistributed with Patent2Market. Using an openly licensed model does not guarantee the accuracy or rights status of its outputs.
