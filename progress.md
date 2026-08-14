# Veya Development Progress

> Your career, already understood.
> A privacy-first AI career assistant that lives in the browser.

## Current Phase

Phase 7 — Browser extension foundation COMPLETE (builds, loads in Chromium, e2e scan+fill passes). Phases 12–16 COMPLETE (document engine, landing page, CLI, fixtures/CI/docs/repo, packaging). Landing page redesigned to the "Career Timetable" monochrome world (impeccable process, finish-review PASS, DESIGN.md + sidecar). Only remaining item: Phase 11's panel⇄SW flow needs a real-browser pass.

## Overall Status

- Phase 1 (Discovery) — COMPLETE
- Phase 2 (Branding) — COMPLETE (name cleared)
- Phase 3 (Architecture) — COMPLETE
- Phase 4 (Repository initialization) — COMPLETE
- Phase 5 (Design system & brand identity) — COMPLETE (tokens/logo/logger + icon PNG generation)
- Phase 6 (Career profile engine) — COMPLETE (8 tests)
- Phase 7 (Browser extension foundation) — COMPLETE (MV3 shell builds, loads, e2e scan+fill verified)
- Phase 8 (Form intelligence) — COMPLETE (16 tests, realm-agnostic DOM)
- Phase 9 (AI provider architecture) — COMPLETE (Ollama live-tested)
- Phase 10 (Prompt system & context engine) — COMPLETE (5+9+11 tests)
- Phase 11 (Application intelligence) — PARTIAL (extension orchestration logic extracted to `src/background/logic.ts`, unit-tested; background handles analyzeJob/generate/profile flows; side panel shows job context + AI draft button. Panel ⇄ SW routing not yet verified in a real browser — headless Playwright cannot deliver page→SW messages)
- Phase 12 (Document engine) — COMPLETE
- Phase 13 (Landing page) — COMPLETE
- Phase 14 (CLI & local companion) — COMPLETE (`apps/cli`, `veya doctor/profile/resume/cover-letter`, 14 tests; verified live: resume PDF → profile seed → import → cover letter → PDF via Ollama)
- Phase 15 (Testing, security, docs, CI) — COMPLETE (job-site fixtures + form-engine fixture tests, GitHub Actions CI green, README, repo pushed to github.com/Jasowills/veya)
- Phase 16 (Packaging & final audit) — COMPLETE (extension zip + CLI global install via `pnpm add --global .`, `veya doctor` verified on the installed bin, README packaging section, stale progress.md sections refreshed, full repo checks green)

## Completed

- Environment discovery: macOS 26.5.2, Node v24.16.0, npm 11.18.0, pnpm 11.12.0, git 2.50.1, gh 2.97.0 (authed as `Jasowills`, scopes incl. `repo`, HTTPS protocol), Ollama 0.32.5 running locally, Chrome + Safari installed.
- Ollama verified live at `http://localhost:11434` with models: `qwen2.5:7b`, `gemma4:e4b`, `llama3.2:1b`.
- Brand name check: GitHub `veya` free; npm `veya` free (registry 404). No obvious conflict. Keep `VEYA`.
- Skills audited. Relevant: frontend-design, impeccable, ui-ux-pro-max, webapp-testing, browser-use, demo-video, remotion-best-practices.
- Package stack verified against registry: typescript@7.0.2, vite@8.2.1, react@19.2.8, react-dom@19.2.8, vitest@4.1.10, zod@4.4.3, turbo@2.10.9, @vitejs/plugin-react@6.0.5, @playwright/test@1.62.1, commander@15.0.0, pdf-parse@2.4.5.
- Repo initialized at `~/veya`. pnpm workspace + turbo configured. All packages typecheck + build.
- Design system: graphite+lime tokens (`@veya/shared`), Instrument Sans + Geist Mono, convergence logo mark (SVG + React), privacy-aware logger, typed VeyaError. `prefers-color-scheme` light/dark.
- Career profile engine: Zod schema, KVStorage (Memory/File), ProfileRepository (CRUD, export/import, deleteAll), controlled memory, deterministic field resolution. 8 tests.
- @veya/security: prompt-injection detection (17 patterns), untrusted-content sanitizers, context boundary assembly, sensitive-value classification (email/phone/apiKey). 9 tests.
- @veya/prompts: CORE_SYSTEM_INSTRUCTIONS (no-fabrication rule), 6 template instructions, verified-profile serialization, application serialization, 5 prompt builders with hard context boundaries. 5 tests.
- @veya/providers: shared HTTP client with typed errors + retry classification, OllamaProvider (LIVE-TESTED against 0.32.5: health, model list, generation all pass), OpenAICompatibleProvider (OpenAI/OpenRouter/Groq/LM Studio), AnthropicProvider + GeminiProvider (implemented, NOT live-tested — no keys), provider registry/buildProvider.
- @veya/ai: context selector (category → minimal verified subset; demographic/legal get zero profile data), DecisionEngine (fill/preference/saved-answer/derive/generate/ask with saved-answer token matching), AnswerGenerator (provider+prompt orchestration, injection gate), JSON block extractor. 11 tests.
- @veya/form-engine: keyword normalization (longest-match scoring, camelCase/underscore handling), realm-agnostic DOM scanning (labels/aria/legend/heading/select options/radio groups), React-compatible value setting via native prototype setters + bubbled events. 16 tests.
- @veya/extension (MV3, `apps/extension`): minimal permissions (`storage`, `activeTab`, `scripting`, `sidePanel`; host_permissions only `localhost:11434`). Side panel is the primary UI (`openPanelOnActionClick`), options page for provider/model/API-key config, on-demand content-script injection via `chrome.scripting` (no broad `content_scripts`). Message protocol content ↔ service worker ↔ UI defined in `src/shared/messages.ts`. Background orchestrates scan → plan (DecisionEngine per field) → fill. Vite split into three sequential builds (UI HTML entries, content IIFE, background ESM) — Vite 8 dropped array configs. Icons rendered from `logo.svg` via Playwright at 16/32/48/128 into `resources/icons`, copied by `scripts/finalize.mjs`. Verified in real Chromium: manifest loads, SW starts, side panel renders, and an e2e run (test-manifest with `http://localhost/*` + `tabs`) scans a 9-field fixture form (correct normalizations incl. WORK_AUTHORIZATION/SPONSORSHIP_REQUIRED/AVAILABILITY) and fills 4 fields into the live DOM.
- Phase 11 extension logic: `src/background/logic.ts` holds the pure, chrome-free functions `jobFromHeuristics` (title/URL → company/role, drops job-board subdomains like `careers.`), `buildPlan` (DecisionEngine per field → FieldDecision), and `fillableAnswers` (edited > draft > decision). Background service worker wires them to `analyzeJob` (AI, heuristic fallback), `generateAnswer` (DecisionEngine gate → AnswerGenerator with job context), and profile handlers (get/save/export/import). Side panel renders job context + AI-draft buttons; options page gained a tabbed `ProfileEditor` (basics/experience/skills/preferences) with import/export. 8 unit tests.
- @veya/document-engine: `parseResumePdf` (text extraction via `pdf-parse@2` — API now VERIFIED via a pdf-lib→pdf-parse roundtrip test) + `parseResumeText` (heuristic section detection: contact/skills/experience/education, experience block grouping, date/bullet recognition), `generateCoverLetter` (profile + application → @veya/prompts cover-letter builder → any AIProvider), `composeTextPdf`/`composeCoverLetterPdf` (greedy-wrapped, paginated PDF via `pdf-lib`, US Letter default, custom margins/fonts). 10 unit tests + 1 live Ollama test (llama3.2:1b → cover letter → valid PDF).
- @veya/website (`apps/website`): React 19 + Vite landing page redesigned to the "Career Timetable" world (impeccable concept-seed `2bad5a15`, candidate 6) — warm paper/ink monochrome (paper #f1eee6 / ink #17140e, no accent hue), Archivo display + Instrument Serif italic counterpoint + IBM Plex Mono data, hairline rules, near-square 2–3px corners, one authored motion moment (the live departure-board hero that ticks its clock and sweeps an ink scan line; respects `prefers-reduced-motion`). **Expansive layout (v2):** 1400px measure + full-bleed bands; hero = headline + live animated product demo (the extension in work on a job form — browser + docked Veya panel, one 18s CSS loop, no video) with the full-width departure board as the station floor beneath; trust strip; route steps (STOP 01/02/03); features ledger (ruled 2-col grid); full-bleed inverted light privacy band (/no-backend · /no-training · /no-guessing · /byok); full-bleed light closing band merging open source + install (split by a vertical hairline). 6 content sections. Website overrides `@veya/shared` tokens site-wide (incl. monochrome `--veya-accent`) so the shared LogoMark renders in ink. **Inverted (dark-first) theme:** the whole palette flipped — warm black page (#17140e), bone ink text (#f1eee6, 15.85:1), muted ink-2 #a49c87 (6.72:1), ink-3 #8a8170 (4.77:1), raised paper #1f1a11, deep paper #2a2418; `color-scheme: dark`; the two gravity bands (privacy + closing) flip to light. Verified headless: 0px horizontal overflow at 375/768/1024/1440/1920, board stretches to the 1400px measure, fonts loaded (serif italic confirmed), privacy full-bleed, finale collapses to 1 col, detector clean, no console errors, dark theme + reduced-motion settled state confirmed, contrast ratios held. Recorded in `PRODUCT.md` + `DESIGN.md` + `.impeccable/design.json`.
- @veya/cli (`apps/cli`, bin `veya`): commander-based local companion. `veya doctor` (node/profile-dir/extension-build/ollama health checks, critical-failure exit code), `veya profile init|show|export|import` (import accepts bare seeds or full export envelopes; store at `~/.veya/profile.json` via FileStorage + a small Node `FileSystemLike` adapter in `src/fs.ts`), `veya resume parse <file.pdf>` (document-engine → profile seed, mapped in `src/resume-mapper.ts`), `veya cover-letter` (profile + job context → Ollama → text or PDF). 14 unit tests. Live-verified end-to-end: generated resume PDF → `resume parse` → `profile import` → `cover-letter` (llama3.2:1b) → valid PDF.
- Assumption verified: `composeTextPdf` now preserves single-newline structure (draws each page as one multi-line `drawText`) so pdf-parse reads real line breaks back; parser also ignores pdf-parse footer artifacts (`-- 1 of 1 --`, `Page N of N`) and no longer treats an email domain as a website.

## In Progress

- Nothing blocked the build pipeline; the only open item is the real-browser verification of the side-panel flow (see Blocked).

## Blocked

- Phase 11 extension e2e: in Playwright HEADLESS Chromium, `chrome.runtime.sendMessage` from an extension page (side panel) to the MV3 service worker never delivers — even an echo listener registered inside the worker is never invoked. SW→tab messaging works headless (that path is e2e-covered). Page→SW routing must be verified in a real (headed) Chrome session before the panel flow can be called done. Diagnostic script: `apps/extension/scripts/swprobe.mjs`.

## Decisions

- Monorepo: pnpm workspaces + Turborepo. Chosen deliberately over plain npm workspaces for cached task orchestration; avoids unnecessary infra.
- TypeScript 7.0.2 (native). If typecheck proves incompatible, fall back to 5.x line.
- Extension build: plain Vite multi-entry (popup/sidepanel/options HTML + lib-mode content script + service worker) with a hand-written MV3 manifest. Avoids @crxjs staleness; fully verifiable.
- Providers MV1: Ollama + OpenAI-compatible adapter (covers OpenRouter, LM Studio, Groq). Anthropic/Gemini via adapters designed but only marked tested when actually verified.

## Architecture Decisions

- Root layout:
  - `apps/extension` — Chrome MV3 extension (popup, side panel, options, content script, service worker)
  - `apps/website` — React landing page (Vite + React 19)
  - `apps/cli` — optional power-user CLI + local companion
  - `packages/core` — shared types, domain models, application session state
  - `packages/profile` — CareerProfile schema, storage, export/import, saved answers
  - `packages/form-engine` — field detection, normalization, classification, autofill
  - `packages/document-engine` — resume parse, cover-letter + PDF compositing
  - `packages/ai` — provider abstraction, context selection, request orchestration
  - `packages/providers` — Ollama, OpenAI-compatible, Anthropic, Gemini, OpenRouter adapters
  - `packages/prompts` — prompt templates & system instructions (context-boundary architecture)
  - `packages/security` — redaction, prompt-injection defense, storage hygiene
  - `packages/shared` — branding tokens, shared utils, logger (privacy-aware)
- Privacy architecture: LOCAL FIRST. No Veya backend. Extension talks directly to user-chosen provider (Ollama localhost or BYOK cloud).
- Content scripts stay lightweight DOM; React reserved for popup/sidepanel/options.

## Known Issues

- TS 7.0.2 resolves inherited `paths` relative to the child tsconfig, not the declaring base config → path maps must live per-package. Resolved via `tsconfig.typecheck.json` per package.
- `rootDir` conflicts when typecheck includes external workspace sources → split `tsconfig.json` (build) vs `tsconfig.typecheck.json` (rootDir=repo root, noEmit).
- Vite 8 no longer accepts array config exports → extension uses three sequential `--config` builds.
- Extension background/UI flow is functional but the side panel's fill plan is not yet persisted across page navigations (in-memory `scanState`).
- Playwright headless cannot deliver page→SW runtime messages for MV3 extensions (panel flow unverifiable headless; SW→tab path works).
- Ollama on this Mac is memory-constrained: loading `qwen2.5:7b` together with `gemma4:e4b` can stall generations for minutes. `llama3.2:1b` is the reliable live-test model; unload big models (`keep_alive:0`) before live runs.

## Unverified Assumptions

- Vite 8 multi-entry lib build for MV3 is compatible with React 19 popup (VERIFIED on first build + load in Chromium).
- `pdf-parse@2` API signature in Node CLI (VERIFIED in Phase 12: `new PDFParse({ data })` → `await getText()` → `result.text`; roundtrip test passes).
- Anthropic/Gemini provider adapters (no API keys to live-test).
- Side panel opening via action click grants `activeTab` for on-demand content injection (verify in real user flow; e2e used a test manifest with explicit host permission).

## Tests Performed

- `ollama list` + `GET /api/tags` against localhost:11434 → OK, returns models.
- gh auth → OK (HTTPS, keyring).
- `pnpm install` → OK. All 12 packages/tasks: typecheck + build → OK (green locally AND on GitHub Actions CI).
- Unit tests: profile 8/8, security 9/9, prompts 5/5, providers live 3/3 (VEYA_OLLAMA_TEST=1), ai 11/11, form-engine 19/19 (16 + 3 job-site fixture tests), document-engine 11/11 (+1 live Ollama, gated), extension logic 8/8, CLI 14/14 → OK.
- Extension smoke (`scripts/smoke.mjs`): extension loads in headless Chromium, service worker starts, side panel renders → OK (also the CI smoke job).
- Extension e2e (`scripts/e2e.mjs`, test manifest, now serving `tests/fixtures/job-sites/workable.html`): 9-field fixture scan with correct normalization, 4-field fill verified in live DOM → OK headless; the side-panel scan step requires a real browser (see Blocked).
- Document-engine live (`VEYA_OLLAMA_TEST=1`): 1/1 — llama3.2:1b generated a cover letter from profile+job and rendered a valid PDF → OK.
- CLI live end-to-end: generated résumé PDF → `veya resume parse` → `veya profile import` → `veya cover-letter` (llama3.2:1b) → valid PDF → OK.
- CLI distribution: `cd apps/cli && pnpm add --global .` → `veya` on PATH, `veya doctor` all-green (node, profile, extension build, ollama) → OK.
- Packaging: `pnpm package` → `release/veya-extension.zip` (manifest.json at root + icons + background/content/ui) → OK.
- Website: headless verification — 0 console errors, no horizontal overflow at 375/768/1440px, fonts loaded, departure-board rows/statuses/scan present, all sections present, body contrast 15.85:1, finish-review (fresh-context subagent) PASS → OK.
- Demo slot — the product, in work (live, not a video): an animated miniature of the extension running on a job page, looping in-DOM via a single 18s CSS keyframe loop (container-query scaled, 375–1920px). Browser (jobs.acme.com/apply/staff-engineer, Staff Engineer — Apply, 2-col form of the 8 fields) beside a docked Veya side panel: status pills AI READY → SCANNING… → FIELDS MAPPED → READY, SCAN FORM → DONE — 8/8, 8 rows with ✓/DRAFT/FOR YOU chips, an AI-draft card that types "I'd pick your stack.", footer `5 VERIFIED · 1 DRAFTED · 2 FOR YOU` / `NOTHING LEAVES THIS MACHINE`. Loop-dip masks the reset; REPLAY restarts via remount; prefers-reduced-motion settles to the static verified state. Verified headless: no overflow at 375–1920px, choreography sweep (all windows play + reset over 12s), reduced-motion settled state, replay works, zero console errors. Removed the earlier film wiring + `public/demo/*`; Remotion source stays in `vey a-demo/` (committed, regenerable).
- GitHub Actions CI: `typecheck · build · test` + `extension headless smoke` both green on main.

## Next Steps

1. Verify panel ⇄ SW routing + Phase 11 UI flow in a real (headed) Chrome session; then mark Phase 11 COMPLETE (only remaining blocker).
2. Future: Web Store listing, cross-site verification, `@veya/cli` publishing story if the CLI becomes a standalone distribution.

## Important Context

- GitHub username: `Jasowills`. Personal portfolio repo `Amadi-jason` exists; unrelated to Veya.
- Ollama 0.32.5 available for live integration testing. `qwen2.5:7b` is the default local test model.
- Never expose the gh token (gh auth uses keyring; avoid `gh auth status` output in logs with token).
- This file is the project's persistent memory. Read FIRST on context loss.