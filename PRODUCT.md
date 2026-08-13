# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary visitor: career switchers and active applicants filling out job applications from the browser. They are re-typing the same identity, history, and skills facts into every ATS form and resent it; they want speed and fewer rewrites, and they are willing to trust an extension with career data only if it feels credible and safe. Secondary audience: privacy-conscious technical users who will scrutinize local-first claims.

## Product Purpose

Veya is a privacy-first AI career assistant for the browser: one structured profile, every application. It reads the job form in place, fills verified facts, drafts open questions with the AI the user chooses, and keeps every byte on the user's machine — no Veya server, no account, no training on user data.

## Positioning

The mechanism a competitor could not truthfully copy: a fully local-first career assistant. No Veya backend exists; the AI is the user's own (Ollama locally, or their own API key for OpenAI/Anthropic/Gemini/Groq/OpenRouter); sensitive categories (work authorization, sponsorship, salary, relocation, demographics, legal) are never auto-inferred. The repo is public and open source.

## Operating Context

The visitor meets Veya through the landing page and installs it as a Chrome (MV3) extension loaded unpacked, then sets a model in Options. The product ecosystem includes: a form engine that classifies fields from messy DOM, an AI answer generator, a document engine (résumé parsing and cover-letter PDFs), and a CLI companion (profile import/export, résumé parse, cover-letter generation). A real job form scan produces real detected fields, decisions, and AI drafts; the landing page's scan-to-fill visual is a faithful demonstration of that mechanism.

## Capabilities and Constraints

Confirmed capabilities: form scan + verified fill + AI drafts; BYOK model config; profile import/export as a plain JSON file; résumé PDF parsing to seed a profile; cover-letter PDF generation; a doctor/diagnostic CLI. Constraints: works in Chrome via unpacked extension (not yet on the Web Store); sensitive fields require explicit user choices; copy must never claim site support that is not tested (form engine is fixture-tested against synthetic Workable/Greenhouse-style markup only). Landing page must stay accurate: no fabricated testimonials, benchmarks, customers, or store listing claims.

## Brand Commitments

Name "Veya" (pronounced VAY-uh), tagline "Your career, already understood." Existing voice: restrained, precise, technical-instrument with quiet warmth; existing wordmark/logo asset in @veya/shared. The user has made binding visual constraints for the landing page redesign: monochrome theme, premium/expensive feel, fully responsive. Landing page copy, factual claims, and links (github.com/Jasowills/veya, #install flow) must be preserved as-is.

## Evidence on Hand

Real assets in-repo: logo (packages/shared/src/logo.svg), @veya/shared tokens, the existing landing page (apps/website), extension build (apps/extension/dist), release packaging (release/veya-extension.zip), a public GitHub repo (github.com/Jasowills/veya), and a live local preview. Absent: customer testimonials, benchmarks, pricing, Web Store listing — these must not be fabricated.

## Product Principles

1. Local-first is an architecture, not a slogan — the page must show the mechanism, never just claim it.
2. Trust is earned with precision: every claim traceable to a real capability or fixture test.
3. The user's career data is the crown jewel; the design must make care and restraint feel like luxury.
4. One profile, every application: the "expensive, trustworthy" impression wins when the page proves the product understands the applicant's actual job.

## Accessibility & Inclusion

No product-specific accessibility requirement beyond the platform baseline (keyboard-visible focus, contrast ≥ WCAG AA, prefers-reduced-motion respected).
