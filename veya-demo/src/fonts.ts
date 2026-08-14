import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";

const archivo = loadArchivo("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin"],
});
const plex = loadPlex("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export const FONT = {
  display: archivo.fontFamily,
  mono: plex.fontFamily,
  serif: serif.fontFamily,
};
