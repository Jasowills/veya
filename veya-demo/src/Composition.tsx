import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeIn, fadeOut } from "./atoms";
import { cameraAt } from "./camera";
import { EndCard } from "./EndCard";
import { Hook } from "./Hook";
import { Overlay } from "./Overlay";
import { THEME } from "./theme";
import { Workspace } from "./Workspace";

export const VeyaDemo: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f);

  const hookOp = Math.min(fadeIn(f, 0, 12), fadeOut(f, 66, 75));
  const workOp = Math.min(fadeIn(f, 78, 92), fadeOut(f, 622, 634));
  const endOp = fadeIn(f, 634, 652);

  return (
    <AbsoluteFill style={{ background: THEME.paper }}>
      <AbsoluteFill
        style={{
          transform: `scale(${cam.s})`,
          transformOrigin: `${cam.x}px ${cam.y}px`,
          willChange: "transform",
        }}
      >
        <AbsoluteFill style={{ opacity: hookOp }}>
          <Hook />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: workOp }}>
          <Workspace />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: endOp }}>
          <EndCard />
        </AbsoluteFill>
      </AbsoluteFill>
      <Overlay />
    </AbsoluteFill>
  );
};
