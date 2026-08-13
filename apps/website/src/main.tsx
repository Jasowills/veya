import { createRoot } from "react-dom/client";
import "@veya/shared/tokens.css";
import "./styles.css";
import { App } from "./App.js";

createRoot(document.getElementById("root")!).render(<App />);
