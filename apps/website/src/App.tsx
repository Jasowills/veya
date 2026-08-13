import { useEffect, useRef, type ReactNode } from "react";
import { LogoMark, Wordmark } from "@veya/shared";

/* ------------------------------------------------------------------ */
/* Scroll-reveal                                                       */
/* ------------------------------------------------------------------ */

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) el.classList.add("in");
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scan panel — the hero visual: a Veya side panel filling a form      */
/* ------------------------------------------------------------------ */

const FIELD_ROWS = [
  { label: "First name", value: "Ada", kind: "fill" },
  { label: "Email", value: "ada@example.com", kind: "fill" },
  { label: "Authorized to work", value: "Yes", kind: "fill" },
  { label: "Years of Rust", value: "8", kind: "fill" },
  { label: "Why this role?", value: "AI draft · review before submit", kind: "draft" },
] as const;

function ScanPanel() {
  return (
    <div className="panel">
      <div className="panel__bar">
        <div className="panel__tabs">
          <span className="panel__tab">
            <span className="panel__url" />
            careers.acme.io/jobs/42
          </span>
          <span className="panel__tab panel__tab--active">
            <LogoMark size={13} />
            veya
          </span>
        </div>
      </div>

      <div className="panel__body">
        <div className="panel__meta">
          <span className="chip chip--accent">● LIVE</span>
          <span className="panel__metaText">8 fields detected · 5 verified · 1 drafted</span>
        </div>

        <div className="scan">
          <div className="scan__beam" />
          {FIELD_ROWS.map((row, i) => (
            <div className={`row row--${row.kind}`} key={row.label} style={{ ["--i" as string]: i }}>
              <span className="row__label">{row.label}</span>
              <span className="row__slot">{row.value}</span>
              <span className="row__status">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ))}
        </div>

        <div className="panel__footer">
          <span className="panel__footKey">local-first</span>
          <span className="panel__footValue">nothing leaves this machine</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Nav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#top" aria-label="Veya home">
        <Wordmark size={19} />
      </a>
      <nav className="nav__links" aria-label="Primary">
        <a href="#how">how it works</a>
        <a href="#privacy">privacy</a>
        <a href="#open-source">open source</a>
      </nav>
      <a className="btn btn--solid" href="#install">
        Get Veya
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__grid" />
      <div className="hero__inner">
        <div className="hero__copy">
          <Reveal>
            <p className="kicker">
              <span className="kicker__dot" />
              VAY-uh · a privacy-first career assistant
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="hero__title">
              Your career,
              <br />
              <em>already understood.</em>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="hero__sub">
              One profile. Every application. Veya lives in your browser, reads the form, fills what it knows,
              drafts the rest — and keeps every byte on your machine.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="hero__cta">
              <a className="btn btn--solid btn--lg" href="#install">
                Install the extension
              </a>
              <a className="btn btn--ghost btn--lg" href="#how">
                See how it works <span aria-hidden="true">↓</span>
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <p className="hero__note mono">
              no account · no cloud · bring your own model
            </p>
          </Reveal>
        </div>

        <Reveal delay={200} className="hero__visual">
          <ScanPanel />
        </Reveal>
      </div>
    </section>
  );
}

function Trust() {
  const items = ["no cloud account", "no training on your data", "no résumé scraping", "no tracking"] as const;
  return (
    <section className="trust" aria-label="Guarantees">
      <div className="trust__inner">
        {items.map((item) => (
          <div className="trust__item mono" key={item}>
            <span className="trust__tick">✓</span> {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Write your profile once",
      body: "Identity, work history, skills, preferences — a structured record you own. Edit it in the extension, or import a résumé and let Veya seed it.",
      tag: "PROFILE",
    },
    {
      n: "02",
      title: "Open any application",
      body: "Veya scans the form in place — no page data leaves the tab. The form engine maps every field to what it means, even when the markup is messy.",
      tag: "FORM",
    },
    {
      n: "03",
      title: "Review, draft, submit",
      body: "Facts are filled from your verified profile. Open questions get an AI draft. Sensitive answers are never guessed — you decide those, always.",
      tag: "REVIEW",
    },
  ];
  return (
    <section className="section" id="how">
      <Reveal>
        <p className="section__kicker mono">HOW IT WORKS</p>
        <h2 className="section__title">Three movements.<br />Zero rewrites.</h2>
      </Reveal>
      <div className="steps">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 90}>
            <article className="step">
              <span className="step__n mono">{s.n}</span>
              <span className="step__tag mono">{s.tag}</span>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__body">{s.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: "⌕", name: "Form intelligence", body: "A deterministic engine classifies fields — name, work authorization, LinkedIn, availability — from messy, framework-built DOM." },
    { icon: "◆", name: "Model-agnostic AI", body: "Ollama on your machine, or your own key for OpenAI, Anthropic, Gemini, Groq, OpenRouter. Nothing routed through Veya." },
    { icon: "▤", name: "Document engine", body: "Parse a résumé PDF to seed your profile. Generate a tailored cover letter and export it as a clean PDF." },
    { icon: "✓", name: "Review-first by design", body: "Every answer is sourced — verified, preference, saved answer, or draft. You approve before anything is submitted." },
    { icon: "⇄", name: "Import & export", body: "Your profile is a plain file. Take it with you, version it, restore it. Portable by construction." },
    { icon: "◎", name: "Sensitive by default", body: "Demographics, sponsorship, salary, legal — Veya never auto-infers these. Only explicit choices fill them." },
  ];
  return (
    <section className="section section--features" id="features">
      <Reveal>
        <p className="section__kicker mono">THE ENGINE</p>
        <h2 className="section__title">Small, sharp, on your side.</h2>
      </Reveal>
      <div className="features">
        {features.map((f, i) => (
          <Reveal key={f.name} delay={(i % 3) * 80} className="features__cell">
            <article className="feature">
              <span className="feature__icon" aria-hidden="true">
                {f.icon}
              </span>
              <h3 className="feature__name">{f.name}</h3>
              <p className="feature__body">{f.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Privacy() {
  return (
    <section className="privacy" id="privacy">
      <Reveal>
        <div className="privacy__panel">
          <div className="privacy__head">
            <p className="section__kicker mono">PRIVACY, FIRST</p>
            <LogoMark size={40} />
          </div>
          <h2 className="privacy__title">Your data never leaves your machine.</h2>
          <p className="privacy__body">
            Veya is local-first by architecture, not by marketing. The extension writes to your browser's storage.
            The AI you use is the AI you pick — a model running on your computer, or your own API key.
            There is no Veya server, no analytics ping, no invisible third party.
          </p>
          <ul className="privacy__list">
            <li className="mono"><span>/no-backend</span> no Veya servers, ever</li>
            <li className="mono"><span>/no-training</span> your profile is never a dataset</li>
            <li className="mono"><span>/no-guessing</span> sensitive answers stay yours</li>
            <li className="mono"><span>/byok</span> bring your own model & key</li>
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

function OpenSource() {
  return (
    <section className="section section--oss" id="open-source">
      <Reveal>
        <p className="section__kicker mono">OPEN SOURCE</p>
        <h2 className="section__title">Read every line.</h2>
        <p className="section__lead">
          Trust is earned in the source. Veya is a single repo — the form engine, the security layer, the
          providers, the extension. Audit it, fork it, file an issue.
        </p>
        <div className="oss__cta">
          <a className="btn btn--ghost mono" href="https://github.com/Jasowills/veya" rel="noreferrer">
            github.com/Jasowills/veya →
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Install() {
  return (
    <section className="install" id="install">
      <div className="install__inner">
        <Reveal>
          <p className="kicker kicker--center">
            <span className="kicker__dot" />
            GET STARTED
          </p>
          <h2 className="install__title">
            One profile.
            <br />
            Every application.
          </h2>
          <div className="install__cta">
            <a className="btn btn--solid btn--lg" href="https://github.com/Jasowills/veya/releases">
              Install for Chrome
            </a>
            <span className="install__hint mono">→ loads as an unpacked extension · 30 seconds</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <Wordmark size={18} />
        <p className="footer__tag mono">your career, already understood</p>
        <div className="footer__links mono">
          <a href="https://github.com/Jasowills/veya">github</a>
          <a href="#privacy">privacy</a>
          <a href="#features">features</a>
        </div>
        <p className="footer__legal mono">© 2026 Veya · open source · made with restraint</p>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Trust />
        <HowItWorks />
        <Features />
        <Privacy />
        <OpenSource />
        <Install />
      </main>
      <Footer />
    </>
  );
}
