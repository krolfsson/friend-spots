#!/usr/bin/env node

/**
 * Fails if any text source file contains NUL bytes (\0),
 * which is a strong indicator the file was saved as UTF-16.
 *
 * This prevents confusing Next/TS errors like:
 *   Unexpected character '\0'
 */

const fsMod = require("node:fs");
const path = require("node:path");

/** @param {string} p */
function posix(p) {
  return p.split(path.sep).join("/");
}

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of fsMod.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const ROOT = path.resolve(__dirname, "..");
const allowedExt = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".md",
  ".css",
  ".scss",
  ".prisma",
  ".txt",
]);

const candidates = walk(ROOT).filter((p) => allowedExt.has(path.extname(p)));

/** @type {string[]} */
const nulFiles = [];
for (const file of candidates) {
  const buf = fsMod.readFileSync(file);
  if (buf.includes(0)) nulFiles.push(posix(path.relative(ROOT, file)));
}

if (nulFiles.length) {
  console.error("\nFound NUL bytes (likely UTF-16 files). Re-save as UTF-8:\n");
  for (const f of nulFiles) console.error(`- ${f}`);
  console.error("\nTip: In Cursor/VS Code: reopen/save with encoding → UTF-8.\n");
  process.exit(1);
}

console.log(`OK: encoding check passed (${candidates.length} files scanned)`);
