import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogoMark, Wordmark } from "@veya/shared";

/* =====================================================================
   Veya landing page — "The Career Timetable"
   THESIS: the job application is a scheduled journey; this page is the
   departure board. One profile, every application, on time.
   OWN-WORLD: warm paper + ink monochrome; hairline rules; tabular mono
   data; one grotesque voice with a serif-italic counterpoint; a single
   authored moment — the board ticking.
   LAYOUT: expansive measure (1400px). Hero = headline left, demo-video
   slot right, full-width departure board below as the station floor.
   Full-bleed ink privacy band; full-bleed deep-paper closing band that
   merges open source + install. 6 content sections.
   FORM: Swiss timetable (candidate 6); seed key 2bad5a15.
   FINISH: unreviewed and undocumented is unfinished; this build ends
   with the finish review, the verdict, and DESIGN.md.
   ===================================================================== */

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
/* Drawn icon system — one stroke, one weight                         */
/* ------------------------------------------------------------------ */

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M4 12.5 L9.5 18 L20 6" {...S} />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="1.5" {...S} />
      <path d="M9 12 h6" {...S} />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="1.5" {...S} />
      <path d="M6 12 H18" {...S} />
      <path d="M6 8 H12" {...S} strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

function NodesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M12 4 V20" {...S} strokeWidth="1.2" opacity="0.5" />
      <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" {...S} />
      <path d="M12 12 H20 M12 12 H4" {...S} strokeWidth="1.2" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M6 3 H15 L19 7 V21 H6 Z" {...S} />
      <path d="M15 3 V7 H19" {...S} />
      <path d="M9 12 H15 M9 16 H13" {...S} strokeWidth="1.2" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M3 12 C6 6.5 9 4 12 4 C15 4 18 6.5 21 12 C18 17.5 15 20 12 20 C9 20 6 17.5 3 12 Z" {...S} />
      <circle cx="12" cy="12" r="3" {...S} />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M4 8 H16 M13 4 L17 8 L13 12" {...S} />
      <path d="M20 16 H8 M11 12 L7 16 L11 20" {...S} />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" {...S} />
      <path d="M8 10.5 V7.5 A4 4 0 0 1 16 7.5 V10.5" {...S} />
      <path d="M12 14.5 V16.5" {...S} strokeWidth="1.4" />
    </svg>
  );
}

function RouteMarker({ filled = false }: { filled?: boolean }) {
  return filled ? (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M12 4 V20 M6 14 L12 20 L18 14" {...S} />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M4 12 H20 M14 6 L20 12 L14 18" {...S} />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M8.5 5.5 L19 12 L8.5 18.5 Z" {...S} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The departure board — the station floor                            */
/* ------------------------------------------------------------------ */

const FIELD_ROWS = [
  { label: "First name", value: "Ada", kind: "fill" },
  { label: "Email", value: "ada@example.com", kind: "fill" },
  { label: "Authorized to work", value: "Yes", kind: "fill" },
  { label: "Years of Rust", value: "8", kind: "fill" },
  { label: "Why this role?", value: "AI draft · review before submit", kind: "draft" },
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function useClock(stepSeconds = 6) {
  const [minute, setMinute] = useState(4);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setMinute((v) => (v + 1) % 60), stepSeconds * 1000);
    return () => window.clearInterval(id);
  }, [stepSeconds]);
  return minute;
}

function DepartureBoard() {
  const now = useClock();
  return (
    <div className="board">
      <div className="board__top">
        <div className="board__station">
          <LogoMark size={16} />
          <span>VEYA</span>
          <span className="board__meta">CAREER SERVICE</span>
        </div>
        <span className="board__live">
          <span className="board__pulse" />
          LIVE
        </span>
      </div>

      <div className="board__head" role="row">
        <span className="board__col board__col--time">DEP</span>
        <span className="board__col board__col--svc">FIELD</span>
        <span className="board__col board__col--dest">VERIFIED VALUE</span>
        <span className="board__col board__col--st">ST</span>
      </div>

      <div className="board__rows">
        <div className="board__scan" aria-hidden="true" />
        {FIELD_ROWS.map((row, i) => {
          const dep = (now - (FIELD_ROWS.length - 1 - i) + 60) % 60;
          return (
            <div className={`board__row board__row--${row.kind}`} key={row.label} style={{ ["--i" as string]: i }}>
              <span className="board__col board__col--time mono">{`12:${pad(dep)}`}</span>
              <span className="board__col board__col--svc">
                <span className="board__svc">{row.label}</span>
              </span>
              <span className="board__col board__col--dest">
                <span className="board__dest mono">{row.value}</span>
              </span>
              <span className="board__col board__col--st">
                <span className={`board__st board__st--${row.kind}`}>
                  {row.kind === "fill" ? <CheckIcon /> : <DraftIcon />}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="board__foot">
        <span className="board__footKey">LOCAL SERVICE</span>
        <span className="board__footMeta">8 fields detected · 5 verified · 1 drafted</span>
        <span className="board__footValue">nothing leaves this machine</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Line label — the kicker reborn as a timetable line                 */
/* ------------------------------------------------------------------ */

function Line({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return (
    <p className={`line ${center ? "line--center" : ""}`}>
      <RouteMarker />
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Ticker() {
  return (
    <div className="ticker">
      <span className="ticker__item">VEYA · CAREER SERVICES</span>
      <span className="ticker__item ticker__item--dim">LOCAL-ONLY</span>
      <span className="ticker__item ticker__item--dim">NO ACCOUNT</span>
      <span className="ticker__item ticker__item--dim">BRING YOUR OWN MODEL</span>
      <span className="ticker__ready mono">
        <span className="board__pulse" />
        BOARD READY
      </span>
    </div>
  );
}

function Nav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#top" aria-label="Veya home">
        <Wordmark size={22} />
      </a>
      <nav className="nav__links" aria-label="Primary">
        <a href="#how">how it works</a>
        <a href="#features">the engine</a>
        <a href="#privacy">privacy</a>
        <a href="#install">get started</a>
      </nav>
      <a className="btn btn--solid" href="#install">
        Get Veya
      </a>
    </header>
  );
}

/* Demo slot — wire the produced video in here (see the demo-video skill). */
function DemoSlot() {
  return (
    <div className="demo">
      <div className="demo__screen" role="img" aria-label="Veya product demo — video coming soon">
        <button className="demo__play" type="button" aria-label="Watch the demo" disabled>
          <PlayIcon />
        </button>
        <span className="demo__plate mono">
          WATCH THE DEMO <ArrowIcon />
        </span>
        <span className="demo__tag mono">01:42</span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__inner">
        <div className="hero__copy">
          <Reveal>
            <Line>VAY-uh · a privacy-first career assistant</Line>
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
                See how it works <DownIcon />
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <p className="hero__note mono">no account · no cloud · bring your own model</p>
            <p className="hero__note hero__note--models mono">
              models: llama · qwen · gemma · claude · gpt · gemini — local, or your own key
            </p>
          </Reveal>
        </div>

        <Reveal delay={200} className="hero__video">
          <DemoSlot />
        </Reveal>
      </div>

      <Reveal delay={280} className="hero__board">
        <DepartureBoard />
      </Reveal>
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
            <span className="trust__tick">
              <CheckIcon />
            </span>
            {item}
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
        <Line>HOW IT WORKS</Line>
        <h2 className="section__title">
          Three movements.<br />Zero rewrites.
        </h2>
      </Reveal>
      <div className="route">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 90} className="route__cell">
            <article className="stop">
              <div className="stop__top">
                <RouteMarker filled />
                <span className="stop__n mono">STOP {s.n}</span>
                <span className="stop__tag mono">{s.tag}</span>
              </div>
              <h3 className="stop__title">{s.title}</h3>
              <p className="stop__body">{s.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: <ScanIcon />, name: "Form intelligence", body: "A deterministic engine classifies fields — name, work authorization, LinkedIn, availability — from messy, framework-built DOM." },
    { icon: <NodesIcon />, name: "Model-agnostic AI", body: "Llama, Qwen, Gemma on your machine via Ollama — or your own key for GPT, Claude, Gemini, Groq, OpenRouter. Nothing routed through Veya." },
    { icon: <DocIcon />, name: "Document engine", body: "Parse a résumé PDF to seed your profile. Generate a tailored cover letter and export it as a clean PDF." },
    { icon: <ReviewIcon />, name: "Review-first by design", body: "Every answer is sourced — verified, preference, saved answer, or draft. You approve before anything is submitted." },
    { icon: <TransferIcon />, name: "Import & export", body: "Your profile is a plain file. Take it with you, version it, restore it. Portable by construction." },
    { icon: <LockIcon />, name: "Sensitive by default", body: "Demographics, sponsorship, salary, legal — Veya never auto-infers these. Only explicit choices fill them." },
  ];
  return (
    <section className="section section--features" id="features">
      <Reveal>
        <Line>THE ENGINE</Line>
        <h2 className="section__title">Small, sharp, on your side.</h2>
      </Reveal>
      <div className="ledger">
        {features.map((f, i) => (
          <Reveal key={f.name} delay={(i % 3) * 60} className="ledger__cell">
            <article className="feature">
              <span className="feature__icon" aria-hidden="true">
                {f.icon}
              </span>
              <div className="feature__text">
                <h3 className="feature__name">{f.name}</h3>
                <p className="feature__body">{f.body}</p>
              </div>
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
        <div className="privacy__inner">
          <div className="privacy__head">
            <Line>PRIVACY, FIRST</Line>
            <LogoMark size={38} />
          </div>
          <h2 className="privacy__title">Your data never leaves your machine.</h2>
          <p className="privacy__body">
            Veya is local-first by architecture, not by marketing. The extension writes to your browser's storage.
            The AI you use is the AI you pick — a model running on your computer, or your own API key.
            There is no Veya server, no analytics ping, no invisible third party.
          </p>
          <ul className="privacy__list">
            <li className="mono">
              <RouteMarker filled />
              <span>/no-backend</span> no Veya servers, ever
            </li>
            <li className="mono">
              <RouteMarker filled />
              <span>/no-training</span> your profile is never a dataset
            </li>
            <li className="mono">
              <RouteMarker filled />
              <span>/no-guessing</span> sensitive answers stay yours
            </li>
            <li className="mono">
              <RouteMarker filled />
              <span>/byok</span> bring your own model &amp; key
            </li>
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

function Finale() {
  return (
    <section className="finale" id="install">
      <div className="finale__inner">
        <div className="finale__col">
          <Reveal>
            <Line>OPEN SOURCE</Line>
            <h2 className="finale__title">Read every line.</h2>
            <p className="finale__lead">
              Trust is earned in the source. Veya is a single repo — the form engine, the security layer, the
              providers, the extension. Audit it, fork it, file an issue.
            </p>
            <div className="finale__cta">
              <a className="btn btn--ghost mono" href="https://github.com/Jasowills/veya" rel="noreferrer">
                github.com/Jasowills/veya <ArrowIcon />
              </a>
            </div>
          </Reveal>
        </div>
        <div className="finale__col">
          <Reveal delay={90}>
            <Line>GET STARTED</Line>
            <h2 className="finale__title">
              One profile.
              <br />
              Every application.
            </h2>
            <div className="finale__cta">
              <a className="btn btn--solid btn--lg" href="https://github.com/Jasowills/veya/releases">
                Install for Chrome
              </a>
              <span className="finale__hint mono">→ loads as an unpacked extension · 30 seconds</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <Wordmark size={19} />
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
      <Ticker />
      <Nav />
      <main>
        <Hero />
        <Trust />
        <HowItWorks />
        <Features />
        <Privacy />
        <Finale />
      </main>
      <Footer />
    </>
  );
}
