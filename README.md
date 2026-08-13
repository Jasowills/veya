# Veya

> Your career, already understood.
> A privacy-first AI career assistant that lives in the browser.

Veya is a privacy-first AI career assistant. It keeps your career profile on
your machine, fills application forms in your browser, and drafts tailored
answers — without a Veya backend, without training on your data, and without
guessing sensitive answers.

## Why Veya

Most job-application flows ship your résumé to a vendor that stores it,
trains on it, and sells access to it. Veya flips the model:

- **No backend.** Everything runs locally. Your profile lives in your browser
  (Chrome extension) or on disk (CLI).
- **No training.** Your data is never used to train a model.
- **No guessing.** Sensitive questions — work authorization, sponsorship,
  salary, demographics — are never auto-answered. Veya asks, or skips.
- **Bring your own keys.** Use a local model (Ollama) or your own API key.

## Repository layout

```
apps/extension        Chrome MV3 extension (side panel, options, content script, service worker)
apps/website          Landing page (React + Vite)
apps/cli              Local companion CLI (`veya`)
packages/core         Shared types, field taxonomy, domain models
packages/profile      CareerProfile schema, storage, export/import
packages/form-engine  Field detection, normalization, classification, autofill
packages/document-engine  Résumé parsing, cover letters, PDF compositing
packages/ai           Decision engine, answer generation
packages/prompts      Prompt builders (verified vs untrusted contexts)
packages/providers    Ollama + OpenAI-compatible adapters
packages/security     Prompt-injection defense, sensitive-category rules
packages/shared       Design tokens, brand icons, logger
tests/fixtures        Job-site fixture HTML used by tests and e2e
```

## Getting started

Requires Node ≥ 20 and pnpm.

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test:unit
```

### Browser extension

```sh
pnpm --filter @veya/extension build
```

Load `apps/extension/dist` as an unpacked extension in Chromium, then open the
side panel on any application page. Point Veya at Ollama (or your own
OpenAI-compatible endpoint) in the options page.

### CLI

```sh
pnpm install && pnpm build
cd apps/cli && pnpm add --global .   # exposes the `veya` command globally

veya doctor
veya profile init
veya resume parse ~/Documents/resume.pdf -o seed.json
veya profile import seed.json
veya cover-letter -c "Acme" -r "Senior Engineer" -o letter.pdf
```

The CLI stores your profile at `~/.veya/profile.json`. `veya doctor` checks the
environment, the extension build, and Ollama connectivity. Within the repo you
can also run it directly: `node apps/cli/dist/index.js`.

## Packaging

```sh
pnpm package
```

Writes `release/veya-extension.zip` (the loadable unpacked extension, `manifest.json`
at the zip root) and `release/veya-cli.linked.md` (CLI install notes). Release
artifacts are gitignored.

## Privacy

- Profile and answers never leave your machine except to the provider you
  configure (default: local Ollama).
- API keys are never stored in page-accessible code.
- Content read from a job page is treated as **untrusted** and is delimited
  from your verified profile before it reaches a model.
- Sensitive categories (work authorization, sponsorship, salary, relocation,
  demographics, legal) are never auto-inferred or auto-filled.

## Testing

- `pnpm typecheck` — TypeScript across all packages
- `pnpm test:unit` — unit tests (logic + integration with fixtures)
- `pnpm --filter @veya/extension build` then
  `node apps/extension/scripts/smoke.mjs` — headless extension smoke test
- `apps/extension/scripts/e2e.mjs` — full scan→plan→fill e2e (requires a real
  browser session for the side-panel flow)

A small amount of functionality is only verified against our own fixtures and
is documented as such — we never claim support for a specific external site.

## License

TBD.
