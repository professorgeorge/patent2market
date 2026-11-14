# Patent2Market

A local-first, install-optional PWA for discovering technologies relevant to real-world problems. Version 0.1 provides an end-to-end investigation workflow, not validated feasibility predictions.

## Run

Requires Node.js 22 or later. No dependency installation is needed.

```sh
npm start
npm test
npm run check
```

Open http://127.0.0.1:4173. Deploy `dist/` on any static HTTPS host. The hosted preview may require host sign-in; the application itself has no account system. HTTPS (or localhost) is required for service workers. Optional installation is browser-dependent; no installation is needed for normal use.

## Features

- 402 actual NASA Technology Transfer listings in a dated keyword snapshot.
- Deterministic BM25-style retrieval: k1=1.2, b=.75, title repeated twice, explicit concept expansion weighted .22. Raw retrieval scores are not probabilities.
- Problem and requirement capture, category filters, source evidence, local shortlist and notes, comparison (first six saved items), Markdown investigation exports.
- Service-worker offline shell and data; browser-local storage, no analytics or AI service calls.
- Semantic HTML, keyboard-operable dialogs, responsive layouts, local system fonts.

## Reproducibility and boundaries

The portable search and brief functions live in `dist/core.js`. Snapshot version and retrieval method accompany exports. `scripts/harvest.ps1` regenerates the curated corpus from eight public NASA API searches; set retrieval date to the actual date when rerunning. The API snapshot is not an exhaustive portfolio or patent-family dataset. NASA technology IDs are not patent numbers. Descriptions are source reports, not independent performance verification. Requirements, TRL, costs, and legal status remain unassessed. No cross-domain embedding performance or commercial success claims are made.

The app caches one release at a time. Increment the cache version in `dist/sw.js` whenever deploying changed assets; close existing tabs to activate a waiting release. Browser storage is not encrypted or backed up; users should export important work. Offline use needs a completed initial cache download. Clearing site data removes saved work.

## Next development priorities

1. Expert-judged need/technology benchmark and retrieval evaluation.
2. Requirement-level evidence annotations and source document enrichment.
3. Verified patent identifiers, families and dated access/status sources.
4. License-reviewed local embeddings, contingent on measured retrieval gains.
5. User-tested workflows with engineering teams solving concrete problems.

## License

Original code is MIT licensed. No third-party application dependencies are installed. NASA content and invention rights are separate: see THIRD_PARTY_NOTICES.md. Open-source licensing and nonprofit use do not guarantee immunity from liability.
