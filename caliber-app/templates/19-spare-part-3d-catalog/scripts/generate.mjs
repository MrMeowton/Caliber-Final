// Cross-platform wrapper for gen_3d_catalog.py (Windows: "python" / "py", macOS/Linux: "python3").
// Usage: npm run generate -- "C:\path\to\Supporting Data"   (or set SUPPORTING_DATA, default ./Supporting Data)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const dataDir = resolve(process.argv[2] ?? process.env.SUPPORTING_DATA ?? "Supporting Data");
if (!existsSync(join(dataDir, "BoM.xlsx"))) {
  console.error(`Supporting Data not found at "${dataDir}" (BoM.xlsx missing).\nRun: npm run generate -- "<folder with the 6 case .xlsx files>"`);
  process.exit(1);
}
const script = join(import.meta.dirname, "gen_3d_catalog.py");
const candidates = process.platform === "win32" ? [["py", ["-3"]], ["python", []]] : [["python3", []], ["python", []]];
for (const [cmd, pre] of candidates) {
  const r = spawnSync(cmd, [...pre, script, dataDir], { stdio: "inherit", shell: process.platform === "win32" });
  if (r.error?.code === "ENOENT" || r.status === 9009) continue; // 9009 = command not found on Windows
  process.exit(r.status ?? 1);
}
console.error("Python 3 not found. Install it from python.org (tick 'Add to PATH'), then: pip install pandas openpyxl");
process.exit(1);
