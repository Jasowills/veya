import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { fadeIn, Mono, SerifIt } from "./atoms";
import { FONT } from "./fonts";
import { THEME } from "./theme";

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const cta = spring({ frame: f - 690, fps: 30, config: { damping: 13, mass: 0.8 } });
  return (
    <AbsoluteFill style={{ background: THEME.paper }}>
      <Mono
        size={24}
        color={THEME.ink2}
        style={{
          position: "absolute",
          top: 150,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: fadeIn(f, 640, 660),
        }}
      >
        VEYA · CAREER SERVICE — LOCAL-ONLY · NO ACCOUNT · BYOK
      </Mono>

      <div
        style={{
          position: "absolute",
          top: 296,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "baseline",
          gap: 28,
          opacity: fadeIn(f, 642, 668),
        }}
      >
        <span
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 200,
            color: THEME.ink,
            letterSpacing: -0.03 * 200,
            lineHeight: 1,
          }}
        >
          VEYA
        </span>
        <SerifIt size={64} color={THEME.ink2}>
          career service
        </SerifIt>
      </div>

      <div
        style={{
          position: "absolute",
          top: 490,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          opacity: fadeIn(f, 646, 676),
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 150,
            color: THEME.ink,
            letterSpacing: -0.025 * 150,
            lineHeight: 1.08,
          }}
        >
          One profile.
        </div>
        <div style={{ marginTop: 6 }}>
          <SerifIt size={150} color={THEME.ink}>
            Every application.
          </SerifIt>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 736,
          left: "50%",
          transform: `translateX(-50%) scale(${0.9 + cta * 0.1})`,
          width: 360,
          height: 100,
          background: THEME.ink,
          opacity: fadeIn(f, 660, 686),
        }}
      >
        <Mono
          size={32}
          weight={600}
          color={THEME.paper}
          style={{ position: "absolute", top: 32, left: 0, right: 0, textAlign: "center" }}
        >
          GET VEYA
        </Mono>
      </div>

      <Mono
        size={22}
        color={THEME.ink3}
        style={{
          position: "absolute",
          top: 884,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: fadeIn(f, 704, 728),
        }}
      >
        github.com/Jasowills/veya — BRING YOUR OWN MODEL
      </Mono>
    </AbsoluteFill>
  );
};
