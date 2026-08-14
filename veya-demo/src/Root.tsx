import { Composition } from "remotion";
import { VeyaDemo } from "./Composition";
import "./index.css";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VeyaDemo"
      component={VeyaDemo}
      durationInFrames={750}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
