import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { blink, fadeIn, Mono, Rule, SerifIt, typed } from "./atoms";
import { FONT } from "./fonts";
import { THEME } from "./theme";

type Kind = "v" | "d" | "s";

type Field = {
  label: string;
  value: string;
  draft?: string;
  kind: Kind;
  reveal: number;
};

const FIELDS: Field[] = [
  { label: "First name", value: "Ada Lovelace", kind: "v", reveal: 250 },
  { label: "Email", value: "ada@example.com", kind: "v", reveal: 268 },
  { label: "Years of Rust", value: "8", kind: "v", reveal: 286 },
  { label: "LinkedIn", value: "in/ada", kind: "v", reveal: 304 },
  { label: "Availability", value: "2 weeks", kind: "v", reveal: 322 },
  {
    label: "Why this role?",
    value: "",
    draft: "Eight years shipping systems at scale. I'd pick your stack again.",
    kind: "d",
    reveal: 340,
  },
  { label: "Work authorization", value: "", kind: "s", reveal: 355 },
  { label: "Salary expectation", value: "", kind: "s", reveal: 370 },
];

const LONG_DRAFT =
  "Eight years shipping systems at this scale. Your stack is the one I would choose again.";

const statusText = (f: number): string => {
  if (f < 224) return "AI READY";
  if (f < 288) return "SCANNING";
  if (f < 360) return "FIELDS MAPPED";
  if (f < 505) return "5 VERIFIED · 1 DRAFTED";
  return "READY";
};

const BrowserWindow: React.FC<{ f: number }> = ({ f }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 120,
        width: 840,
        height: 640,
        background: THEME.paper,
        border: `1.5px solid ${THEME.ruleStrong}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          borderBottom: `1.5px solid ${THEME.rule}`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 26,
              left: 28 + i * 22,
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: THEME.ruleStrong,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: 13,
            left: 210,
            width: 430,
            height: 38,
            background: THEME.paper2,
            border: `1.5px solid ${THEME.rule}`,
          }}
        >
          <Mono
            size={19}
            color={THEME.ink3}
            style={{ position: "absolute", top: 9, left: 0, right: 0, textAlign: "center" }}
          >
            jobs.acme.com/apply/staff-engineer
          </Mono>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 24,
          left: 48,
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: 44,
          color: THEME.ink,
          letterSpacing: -0.01 * 44,
        }}
      >
        Staff Engineer — Apply
      </div>
      <Mono size={19} color={THEME.ink3} style={{ position: "absolute", top: 76, left: 48 }}>
        ACME CORP · SENIOR · REMOTE-FIRST
      </Mono>
      <Rule style={{ position: "absolute", top: 122, left: 48, width: 744 }} />

      {FIELDS.map((field, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 48 + col * 386;
        const y = 148 + row * 90;
        const shown = f >= field.reveal;
        const revealOp = interpolate(f, [field.reveal - 6, field.reveal + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const ty = interpolate(f, [field.reveal - 6, field.reveal + 10], [14, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        let inner: React.ReactNode = null;
        if (shown) {
          if (field.kind === "v") {
            inner = (
              <Mono size={24} color={THEME.ink} style={{ position: "absolute", top: 10, left: 14 }}>
                {field.value}
              </Mono>
            );
          } else if (field.kind === "d") {
            inner = (
              <Mono
                size={24}
                color={THEME.ink}
                style={{ position: "absolute", top: 10, left: 14, right: 14, whiteSpace: "nowrap", overflow: "hidden" }}
              >
                {typed(f, 380, 2.6, field.draft ?? "")}
              </Mono>
            );
          } else {
            inner = (
              <Mono size={19} color={THEME.ink3} style={{ position: "absolute", top: 12, left: 14 }}>
                —
              </Mono>
            );
          }
        }
        return (
          <div key={field.label} style={{ position: "absolute", left: x, top: y, width: 358, height: 90 }}>
            <Mono size={20} color={THEME.ink3}>
              {field.label}
            </Mono>
            <div
              style={{
                position: "absolute",
                top: 30,
                left: 0,
                width: 358,
                height: 44,
                background: THEME.paper,
                border: `1.5px solid ${THEME.ruleStrong}`,
                opacity: revealOp,
                transform: `translateY(${ty}px)`,
              }}
            >
              {inner}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SidePanel: React.FC<{ f: number }> = ({ f }) => {
  const progress = interpolate(f, [244, 372], [0, FIELDS.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanning = f >= 224 && f < 344;
  const done = f >= 288;
  return (
    <div
      style={{
        position: "absolute",
        left: 1010,
        top: 120,
        width: 490,
        height: 900,
        background: THEME.paper2,
        border: `1.5px solid ${THEME.ruleStrong}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 26,
          width: 26,
          height: 26,
          background: THEME.ink,
        }}
      >
        <Mono size={17} color={THEME.paper} weight={600} style={{ position: "absolute", top: 4, left: 6 }}>
          V
        </Mono>
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 62,
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 36,
          color: THEME.ink,
          letterSpacing: -0.02 * 36,
        }}
      >
        VEYA
      </div>
      <Mono size={18} color={THEME.ink3} style={{ position: "absolute", top: 26, left: 132 }}>
        CAREER SERVICE
      </Mono>
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 26,
          padding: "7px 14px",
          border: `1.5px solid ${THEME.ruleStrong}`,
          color: THEME.ink3,
        }}
      >
        <Mono size={16} color={THEME.ink3}>
          LOCAL
        </Mono>
      </div>

      <div
        style={{
          position: "absolute",
          top: 84,
          left: 26,
          padding: "10px 18px",
          background: THEME.ink,
        }}
      >
        <Mono size={20} weight={600} color={THEME.paper}>
          {statusText(f)}
        </Mono>
      </div>

      <div
        style={{
          position: "absolute",
          top: 76,
          right: 26,
          width: 186,
          height: 56,
          background: done ? THEME.paper3 : THEME.ink,
          border: done ? `1.5px solid ${THEME.ruleStrong}` : "none",
          transform: f >= 224 && f <= 236 ? "scale(0.94)" : "scale(1)",
          opacity: interpolate(f, [360, 372], [1, done ? 0.55 : 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Mono
          size={20}
          weight={600}
          color={done ? THEME.ink2 : THEME.paper}
          style={{ position: "absolute", top: 17, left: 0, right: 0, textAlign: "center" }}
        >
          {done ? "DONE — 8/8" : "SCAN FORM"}
        </Mono>
      </div>

      <Mono size={18} color={THEME.ink3} style={{ position: "absolute", top: 156, left: 26 }}>
        8 FIELDS DETECTED — FROM THIS PAGE
      </Mono>

      <div style={{ position: "absolute", top: 184, left: 26, opacity: scanning ? 1 : 0 }}>
        <Mono size={18} color={THEME.ink2}>
          SCANNING…
        </Mono>
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 0,
            width: 438,
            height: 6,
            background: THEME.paper3,
          }}
        >
          <div
            style={{
              width: (progress / FIELDS.length) * 438,
              height: 6,
              background: THEME.ink,
            }}
          />
        </div>
      </div>

      <div style={{ position: "absolute", top: 240, left: 26, width: 438 }}>
        {FIELDS.map((field, r) => {
          const shown = f >= field.reveal;
          const op = interpolate(f, [field.reveal - 6, field.reveal + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const ty = interpolate(f, [field.reveal - 6, field.reveal + 8], [12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          let chip: React.ReactNode;
          if (field.kind === "v") {
            chip = (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 13,
                  width: 30,
                  textAlign: "right",
                }}
              >
                <Mono size={18} weight={600} color={THEME.ink2}>
                  ✓
                </Mono>
              </div>
            );
          } else if (field.kind === "d") {
            chip = (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 8,
                  padding: "4px 10px",
                  background: f >= 462 ? THEME.paper3 : THEME.ink,
                  border: `1.5px solid ${THEME.ruleStrong}`,
                }}
              >
                <Mono size={16} weight={600} color={f >= 462 ? THEME.ink2 : THEME.paper}>
                  {f >= 462 ? "REVIEW" : "DRAFT"}
                </Mono>
              </div>
            );
          } else {
            chip = (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 8,
                  padding: "4px 10px",
                  border: `1.5px solid ${THEME.ruleStrong}`,
                }}
              >
                <Mono size={16} weight={600} color={THEME.ink3}>
                  FOR YOU
                </Mono>
              </div>
            );
          }
          let value: React.ReactNode = null;
          if (shown) {
            if (field.kind === "v") {
              value = (
                <Mono size={22} color={THEME.ink} style={{ position: "absolute", right: 44, top: 11 }}>
                  {field.value}
                </Mono>
              );
            } else if (field.kind === "s") {
              value = (
                <Mono size={19} color={THEME.ink3} style={{ position: "absolute", right: 44, top: 13 }}>
                  —
                </Mono>
              );
            }
          }
          return (
            <div
              key={field.label}
              style={{
                position: "absolute",
                top: r * 46,
                left: 0,
                width: 438,
                height: 46,
                borderBottom: `1.5px solid ${THEME.rule}`,
                opacity: shown ? op : 0,
                transform: `translateY(${ty}px)`,
              }}
            >
              <Mono size={20} color={THEME.ink2} style={{ position: "absolute", left: 0, top: 12 }}>
                {field.label}
              </Mono>
              {value}
              {chip}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            top: 376,
            left: 0,
            width: 438,
            height: 152,
            background: THEME.paper,
            border: `1.5px solid ${THEME.ruleStrong}`,
            opacity: fadeIn(f, 360, 378),
          }}
        >
          <Mono size={18} color={THEME.ink3} style={{ position: "absolute", top: 18, left: 20 }}>
            WHY THIS ROLE? — AI DRAFT
          </Mono>
          <Mono
            size={24}
            color={THEME.ink}
            style={{ position: "absolute", top: 52, left: 20, right: 20 }}
          >
            {typed(f, 395, 1.4, LONG_DRAFT)}
            {f >= 395 && f <= 505 && blink(f) ? "▌" : ""}
          </Mono>
          <Mono
            size={16}
            color={THEME.ink3}
            style={{ position: "absolute", top: 122, left: 20, opacity: fadeIn(f, 462, 478) }}
          >
            REVIEW BEFORE SUBMIT · YOU DECIDE
          </Mono>
        </div>

        <div style={{ position: "absolute", top: 544, left: 0, width: 438, opacity: fadeIn(f, 380, 398) }}>
          <Mono size={20} color={THEME.ink}>
            5 VERIFIED · 1 DRAFTED · 2 FOR YOU
          </Mono>
          <Rule style={{ marginTop: 20 }} />
          <Mono size={17} color={THEME.ink3} style={{ display: "block", marginTop: 14 }}>
            NOTHING LEAVES THIS MACHINE
          </Mono>
        </div>
      </div>
    </div>
  );
};

const ScanBeam: React.FC<{ f: number }> = ({ f }) => {
  const active = f >= 222 && f <= 272;
  const y = interpolate(f, [222, 272], [340, 700], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 168,
        width: 744,
        top: y - 70,
        height: 140,
        background:
          "linear-gradient(to bottom, rgba(23,20,14,0), rgba(23,20,14,0.12) 45%, rgba(23,20,14,0.22))",
        borderBottom: `2px solid rgba(23,20,14,0.4)`,
      }}
    />
  );
};

const Stamp: React.FC<{ f: number }> = ({ f }) => {
  const s = spring({ frame: f - 548, fps: 30, config: { damping: 14, mass: 0.9 } });
  const op = fadeIn(f, 548, 578);
  return (
    <div style={{ position: "absolute", left: 960, top: 420, opacity: op }}>
      <div
        style={{
          position: "absolute",
          left: -240,
          top: -240,
          width: 480,
          height: 480,
          borderRadius: "50%",
          border: `3px dashed ${THEME.ruleStrong}`,
          transform: `scale(${s})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -350,
          top: -58,
          width: 700,
          textAlign: "center",
          transform: `scale(${s})`,
        }}
      >
        <SerifIt size={96} color={THEME.ink}>
          all departures on time
        </SerifIt>
      </div>
      <Mono size={22} weight={600} color={THEME.ink2} style={{ position: "absolute", left: -120, top: 56, width: 240, textAlign: "center" }}>
        VEYA — BOARD READY
      </Mono>
      <Mono size={17} color={THEME.ink3} style={{ position: "absolute", left: -220, top: 92, width: 440, textAlign: "center" }}>
        8 FIELDS · 5 VERIFIED · 1 DRAFTED · 2 FOR YOU
      </Mono>
    </div>
  );
};

const FooterStrip: React.FC<{ f: number }> = ({ f }) => (
  <Mono
    size={20}
    color={THEME.ink3}
    style={{
      position: "absolute",
      top: 938,
      left: "50%",
      transform: "translateX(-50%)",
      opacity: fadeIn(f, 556, 580),
    }}
  >
    LOCAL-ONLY · NO CLOUD · BYOK · OPEN SOURCE
  </Mono>
);

export const Workspace: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: THEME.paper }}>
      <BrowserWindow f={f} />
      <ScanBeam f={f} />
      <SidePanel f={f} />
      <Mono
        size={22}
        color={THEME.ink2}
        style={{
          position: "absolute",
          left: 150,
          top: 945,
          opacity: fadeIn(f, 96, 112) * (f < 205 ? 1 : 0),
        }}
      >
        OPEN ANY APPLICATION →
      </Mono>
      <Stamp f={f} />
      <FooterStrip f={f} />
    </AbsoluteFill>
  );
};
