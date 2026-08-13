import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../ui/base.css";
import "../ui/components.css";
import "./options.css";
import "./pe.css";
import { Options } from "./Options";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Options />
  </StrictMode>,
);
