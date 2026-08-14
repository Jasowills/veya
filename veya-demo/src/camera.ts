import { Easing, interpolate } from "remotion";

export type Cam = { f: number; x: number; y: number; s: number };

const EASE = Easing.bezier(0.45, 0, 0.25, 1);

const CAM: Cam[] = [
  { f: 0, x: 960, y: 540, s: 1.0 },
  { f: 68, x: 960, y: 540, s: 1.05 },
  { f: 92, x: 960, y: 540, s: 1.0 },
  { f: 135, x: 600, y: 480, s: 0.88 },
  { f: 210, x: 1180, y: 430, s: 0.99 },
  { f: 300, x: 1300, y: 470, s: 1.28 },
  { f: 355, x: 1300, y: 485, s: 1.6 },
  { f: 430, x: 1295, y: 620, s: 2.0 },
  { f: 505, x: 1295, y: 620, s: 1.96 },
  { f: 545, x: 960, y: 540, s: 1.14 },
  { f: 600, x: 960, y: 540, s: 1.0 },
  { f: 628, x: 960, y: 540, s: 1.03 },
  { f: 650, x: 960, y: 540, s: 1.0 },
  { f: 750, x: 960, y: 540, s: 1.07 },
];

export const cameraAt = (frame: number): Cam => {
  let a = CAM[0];
  let b = CAM[CAM.length - 1];
  for (let i = 0; i < CAM.length - 1; i++) {
    if (frame >= CAM[i].f && frame <= CAM[i + 1].f) {
      a = CAM[i];
      b = CAM[i + 1];
      break;
    }
  }
  return {
    f: frame,
    x: interpolate(frame, [a.f, b.f], [a.x, b.x], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    y: interpolate(frame, [a.f, b.f], [a.y, b.y], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    s: interpolate(frame, [a.f, b.f], [a.s, b.s], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };
};
