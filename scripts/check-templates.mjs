#!/usr/bin/env node
// Menampilkan semua placeholder [ISI: ...] yang belum diisi, per file.
//   node scripts/check-templates.mjs          -> semua file .md
//   node scripts/check-templates.mjs docs     -> hanya folder tertentu
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".git", ".next", ".vercel"]);
const targets = process.argv.slice(2).map((p) => join(ROOT, p));

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (name.endsWith(".md") && path !== join(ROOT, "README.md")) yield path; // README root hanya menjelaskan konvensi
  }
}

let total = 0;
for (const start of targets.length ? targets : [ROOT]) {
  const files = statSync(start).isDirectory() ? walk(start) : [start];
  for (const file of files) {
    const hits = readFileSync(file, "utf8")
      .split("\n")
      .flatMap((line, i) => (line.includes("[ISI") ? [`  L${i + 1}: ${line.trim().slice(0, 100)}`] : []));
    if (!hits.length) continue;
    total += hits.length;
    console.log(`${relative(ROOT, file)} (${hits.length})`);
    console.log(hits.join("\n"));
  }
}
console.log(total ? `\n${total} baris masih berisi [ISI].` : "Semua template sudah terisi.");
process.exitCode = total ? 1 : 0;
