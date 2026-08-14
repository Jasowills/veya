import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeIn, Mono, SerifIt } from "./atoms";
import { FONT } from "./fonts";
import { THEME } from "./theme";

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
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
          opacity: fadeIn(f, 4, 20),
        }}
      >
        VEYA · CAREER SERVICE — LOCAL-ONLY · NO ACCOUNT · BYOK
      </Mono>

      <div
        style={{
          position: "absolute",
          top: 260,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "baseline",
          gap: 28,
          opacity: fadeIn(f, 8, 30),
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
          top: 470,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          opacity: fadeIn(f, 14, 40),
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
          Your career,
        </div>
        <div style={{ marginTop: 6 }}>
          <SerifIt size={150} color={THEME.ink}>
            already understood.
          </SerifIt>
        </div>
      </div>

      <Mono
        size={24}
        color={THEME.ink2}
        style={{
          position: "absolute",
          top: 900,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: fadeIn(f, 22, 48),
        }}
      >
        A PRIVATE, LOCAL AI CAREER ASSISTANT — OPEN SOURCE · BRING YOUR OWN MODEL
      </Mono>
    </AbsoluteFill>
  );
};
