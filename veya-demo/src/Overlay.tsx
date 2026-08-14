import React from "react";
import { AbsoluteFill } from "remotion";
import { Mono } from "./atoms";
import { THEME } from "./theme";

export const Overlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        background: "radial-gradient(120% 120% at 50% 50%, rgba(23,20,14,0) 58%, rgba(23,20,14,0.2) 100%)",
      }}
    />
    <AbsoluteFill
      style={{
        position: "absolute",
        inset: 56,
        border: `2px solid ${THEME.rule}`,
      }}
    />
    <Mono size={16} color={THEME.ink3} style={{ position: "absolute", left: 80, top: 74 }}>
      LOCAL-ONLY
    </Mono>
    <Mono size={16} color={THEME.ink3} style={{ position: "absolute", right: 80, top: 74 }}>
      NO CLOUD
    </Mono>
    <Mono size={16} color={THEME.ink3} style={{ position: "absolute", left: 80, bottom: 76 }}>
      1080P · 25S
    </Mono>
    <Mono size={16} color={THEME.ink3} style={{ position: "absolute", right: 80, bottom: 76 }}>
      VEYA · CAREER SERVICE — FILM 01
    </Mono>
  </AbsoluteFill>
);
