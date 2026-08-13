/**
 * Packaging — produce release artifacts:
 *   release/veya-extension.zip   the loadable unpacked extension
 *   release/veya-cli.linked.md   instructions (CLI ships as a linked bin)
 *
 * Requires `zip` on PATH (present on macOS and Linux runners).
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const release = resolve(root, "release");

mkdirSync(release, { recursive: true });

const zipPath = resolve(release, "veya-extension.zip");
rmSync(zipPath, { force: true });

execFileSync("zip", ["-r", "-q", zipPath, "."], {
  cwd: resolve(root, "apps/extension", "dist"),
});

writeFileSync(
  resolve(release, "veya-cli.linked.md"),
  [
    "# Veya CLI",
    "",
    "The CLI is built and installed globally from the monorepo:",
    "",
    "    pnpm install && pnpm build",
    "    cd apps/cli && pnpm add --global .   # exposes the `veya` command",
    "",
    "Run `veya --help` for commands.",
  ].join("\n"),
);

console.log(`wrote ${zipPath}`);
console.log(`wrote ${release}/veya-cli.linked.md`);
