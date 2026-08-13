/**
 * `veya doctor` — environment + integration health checks.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { OllamaProvider, OLLAMA_DEFAULT_URL } from "@veya/providers";
import { PROFILE_KEY } from "@veya/profile";
import { openStore } from "./store.js";

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
  critical?: boolean;
}

/** The workspace root: apps/cli/dist/.. is apps/cli, two more hops to the repo root. */
function repoRoot(): string {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return join(here, "..", "..", "..");
}

export async function runDoctor(storeDir: string): Promise<Check[]> {
  const checks: Check[] = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push({
    name: "node",
    ok: nodeMajor >= 20,
    detail: `Node ${process.versions.node}`,
    critical: true,
  });

  let profilePresent = false;
  try {
    const store = openStore(storeDir);
    const raw = await store.repo.exportProfile();
    profilePresent = raw.includes(`"${PROFILE_KEY}"`) || raw.length > 2;
    checks.push({
      name: "profile",
      ok: true,
      detail: `${storeDir}/profile.json${profilePresent ? "" : " (not created yet — run: veya profile init)"}`,
      critical: true,
    });
  } catch {
    checks.push({ name: "profile", ok: false, detail: "could not read the profile store", critical: true });
  }

  const extensionManifest = join(repoRoot(), "apps", "extension", "dist", "manifest.json");
  checks.push({
    name: "extension",
    ok: existsSync(extensionManifest),
    detail: existsSync(extensionManifest) ? "extension build present" : "no apps/extension/dist — run pnpm build",
  });

  let ollama: { ok: boolean; detail: string };
  try {
    const health = await new OllamaProvider(OLLAMA_DEFAULT_URL).healthCheck();
    if (health.ok) {
      const models = await new OllamaProvider(OLLAMA_DEFAULT_URL).listModels();
      ollama = {
        ok: true,
        detail: `${health.message} — ${models.length} model${models.length === 1 ? "" : "s"}: ${models.map((m) => m.id).join(", ")}`,
      };
    } else {
      ollama = { ok: false, detail: health.message };
    }
  } catch {
    ollama = { ok: false, detail: `Ollama unreachable at ${OLLAMA_DEFAULT_URL} (start it or use a cloud provider)` };
  }
  checks.push({ name: "ollama", ok: ollama.ok, detail: ollama.detail });

  return checks;
}

export function printChecks(checks: Check[]): number {
  let failed = 0;
  for (const c of checks) {
    const mark = c.ok ? "ok  " : "FAIL";
    console.log(`${mark}  ${c.name.padEnd(10)} ${c.detail}`);
    if (!c.ok) failed += 1;
  }
  const criticalFailed = checks.some((c) => c.critical && !c.ok);
  if (criticalFailed) {
    console.log("\ncritical checks failed — fix those first.");
    return 1;
  }
  if (failed > 0) console.log(`\n${failed} non-critical check(s) failed.`);
  else console.log("\nall systems nominal.");
  return 0;
}
