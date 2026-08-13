/**
 * Node filesystem adapter for @veya/profile's FileStorage.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { FileSystemLike } from "@veya/profile";

export const nodeFs: FileSystemLike = {
  readFile(path: string): string | null {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return null;
    }
  },
  writeFile(path: string, data: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, data);
  },
};
