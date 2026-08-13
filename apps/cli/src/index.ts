#!/usr/bin/env node
/**
 * Veya CLI — a local companion for your career profile.
 *
 *   veya doctor          environment + integration health checks
 *   veya profile init    create an empty local profile
 *   veya profile show    print the stored profile
 *   veya profile export  write the profile to a JSON file
 *   veya profile import  load a profile from a JSON file
 *   veya resume parse    parse a résumé PDF into a profile seed
 *   veya cover-letter    generate a cover letter (Ollama)
 */

import { Command } from "commander";
import { DEFAULT_DIR } from "./store.js";
import { printChecks, runDoctor } from "./doctor.js";
import { profileExport, profileImport, profileInit, profileShow } from "./profile-cmd.js";
import { resumeParse } from "./resume-cmd.js";
import { coverLetterCommand } from "./cover-letter-cmd.js";

const program = new Command();

program
  .name("veya")
  .description("Veya CLI — privacy-first career profile companion")
  .version("0.1.0");

program.option("--dir <path>", "profile store directory", DEFAULT_DIR);

program
  .command("doctor")
  .description("run environment and integration health checks")
  .action(async () => {
    const { dir } = program.opts();
    const checks = await runDoctor(dir);
    process.exitCode = printChecks(checks);
  });

const profile = program.command("profile").description("manage the local career profile");

profile
  .command("init")
  .description("create an empty profile")
  .action(async () => {
    const { dir } = program.opts();
    await profileInit(dir);
  });

profile
  .command("show")
  .description("print the stored profile")
  .action(async () => {
    const { dir } = program.opts();
    await profileShow(dir);
  });

profile
  .command("export")
  .description("export the profile to a JSON file")
  .option("-o, --out <file>", "output file (default: stdout)")
  .action(async (opts: { out?: string }) => {
    const { dir } = program.opts();
    await profileExport(dir, opts.out);
  });

profile
  .command("import")
  .description("import a profile from a JSON file")
  .argument("<file>", "JSON file to import")
  .action(async (file: string) => {
    const { dir } = program.opts();
    await profileImport(dir, file);
  });

program
  .command("resume")
  .description("parse a résumé PDF into a profile seed")
  .argument("<file>", "path to the résumé PDF")
  .option("-o, --out <file>", "write the profile seed JSON to a file")
  .action(async (file: string, opts: { out?: string }) => {
    const { dir } = program.opts();
    await resumeParse(file, opts.out);
  });

program
  .command("cover-letter")
  .description("generate a cover letter from the profile (Ollama)")
  .option("-c, --company <name>", "target company")
  .option("-r, --role <title>", "target role")
  .option("-l, --location <place>", "job location")
  .option("-d, --description <text>", "job description")
  .option("--company-context <text>", "extra company context (treated as untrusted)")
  .option("-m, --model <name>", "Ollama model", "qwen2.5:7b")
  .option("--base-url <url>", "Ollama base URL", "http://localhost:11434")
  .option("-o, --out <file>", "write result to a file (.pdf renders a PDF)")
  .action(async (opts) => {
    const { dir } = program.opts();
    await coverLetterCommand(dir, opts);
  });

async function main(): Promise<void> {
  program.parseAsync(process.argv).catch((err: unknown) => {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  });
}

void main();
