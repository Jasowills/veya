# Veya Development Progress

> Your career, already understood.
> A privacy-first AI career assistant that lives in the browser.

## Current Phase

Phase 6 — Career profile engine COMPLETE. Next: Phase 7 (browser extension foundation).

## Overall Status

- Phase 1 (Discovery) — COMPLETE
- Phase 2 (Branding) — COMPLETE (name cleared)
- Phase 3 (Architecture) — COMPLETE (monorepo layout decided)
- Phase 4 (Repository initialization) — COMPLETE (pnpm + turbo workspace, git init)
- Phase 5 (Design system & brand identity) — MOSTLY COMPLETE (tokens, logo, logger, errors in `@veya/shared`; icon PNG rendering pending)
- Phase 6 (Career profile engine) — COMPLETE (schema, storage, repository, memory, deterministic field resolution, 8 unit tests passing)
- Phase 7 (Browser extension foundation) — PENDING
- Phase 8 (Form intelligence) — PENDING
- Phase 9 (AI provider architecture) — PENDING
- Phase 10 (Prompt system & context engine) — PENDING
- Phase 11 (Application intelligence) — PENDING
- Phase 12 (Document engine) — PENDING
- Phase 13 (Landing page) — PENDING
- Phase 14 (CLI & local companion) — PENDING
- Phase 15 (Testing, security, docs, CI) — PENDING
- Phase 16 (Packaging & final audit) — PENDING

## Completed

- Environment discovery: macOS 26.5.2, Node v24.16.0, npm 11.18.0, pnpm 11.12.0, git 2.50.1, gh 2.97.0 (authed as `Jasowills`, scopes incl. `repo`, HTTPS protocol), Ollama 0.32.5 running locally, Chrome + Safari installed.
- Ollama verified live at `http://localhost:11434` with models: `qwen2.5:7b`, `gemma4:e4b`, `llama3.2:1b`.
- Brand name check: GitHub `veya` free; npm `veya` free (registry 404). No obvious conflict. Keep `VEYA`.
- Skills audited. Relevant: frontend-design, impeccable, ui-ux-pro-max, webapp-testing, browser-use, demo-video, remotion-best-practices.
- Package stack verified against registry: typescript@7.0.2, vite@8.2.1, react@19.2.8, react-dom@19.2.8, vitest@4.1.10, zod@4.4.3, turbo@2.10.9, @vitejs/plugin-react@6.0.5, @playwright/test@1.62.1, commander@15.0.0, pdf-parse@2.4.5.
- Repo initialized at `~/veya`. pnpm workspace + turbo configured. `@veya/shared`, `@veya/core`, `@veya/profile` built & typechecking.
- Design system: graphite+lime tokens (`@veya/shared`), Instrument Sans + Geist Mono, convergence logo mark (SVG + React), privacy-aware logger, typed VeyaError. `prefers-color-scheme` light/dark.
- Career profile engine: Zod schema (identity, contact, experience, education, skills, projects, certifications, preferences, saved answers, writing style, documents), KVStorage abstraction (Memory/File adapters), ProfileRepository (CRUD, export/import, deleteAll), controlled memory (VERIFIED_FACT/PREFERENCE/SAVED_ANSWER/USER_CORRECTION/GENERATED_CONTEXT with confirmation+promotion), deterministic field resolution engine (sensitive fields never inferred). 8 unit tests passing.
- Resolution engine guards: work authorization, sponsorship, salary, relocation, demographic never auto-inferred without explicit preference.

## In Progress

- Phase 7: Chrome MV3 extension foundation (manifest, popup, sidepanel, options, content script, service worker, build pipeline).

## Blocked

None.

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

## Unverified Assumptions

- TS 7.0.2 `paths`/`rootDir` split is stable across packages (applied to profile; replicate for all dependent packages).
- Vite 8 multi-entry lib build for MV3 is compatible with React 19 popup (verify on first build).
- `pdf-parse@2` API signature in Node CLI (verify when CLI resume parsing is implemented).
- Ollama `/api/generate` streaming contract unchanged (verify against running 0.32.5 instance).

## Tests Performed

- `ollama list` + `GET /api/tags` against localhost:11434 → OK, returns models.
- gh auth → OK (HTTPS, keyring).
- `pnpm install` → OK. `@veya/shared`, `@veya/core` typecheck+build → OK.
- `@veya/profile` typecheck, build, and 8/8 unit tests → OK.

## Next Steps

1. Finish monorepo root config.
2. Phase 5: brand identity (tokens, logo mark, icon assets).
3. Phase 6: `packages/profile` schema + storage with unit tests.
4. Phase 7: extension MV3 shell (manifest, popup, service worker, build pipeline).
5. Phase 8: form-engine detection/classification with fixture pages + unit tests.

## Important Context

- GitHub username: `Jasowills`. Personal portfolio repo `Amadi-jason` exists; unrelated to Veya.
- Ollama 0.32.5 available for live integration testing. `qwen2.5:7b` is the default local test model.
- Never expose the gh token (gh auth uses keyring; avoid `gh auth status` output in logs with token).
- This file is the project's persistent memory. Read FIRST on context loss.