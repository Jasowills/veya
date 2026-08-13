import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../ui/base.css";
import "./sidepanel.css";
import { SidePanel } from "./SidePanel";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>,
);
