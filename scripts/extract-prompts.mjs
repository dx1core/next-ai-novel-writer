/**
 * Emits lib/ai/prompt-generated.ts from AI_NovelGenerator/prompt_definitions.py
 * Run: node scripts/extract-prompts.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, "..")
const src = path.join(
  process.env.PROMPT_PY ?? "/Users/wanglei/Documents/dev/AI_NovelGenerator",
  "prompt_definitions.py"
)
if (!fs.existsSync(src)) {
  console.error("Not found:", src)
  process.exit(1)
}
const p = fs.readFileSync(src, "utf8")
const re = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"""\\?[\n\r]([\s\S]*?)"""/g
const exports = []
let m
for (;;) {
  m = re.exec(p)
  if (m == null) {
    break
  }
  const name = m[1]
  const body = m[2]
  exports.push(`export const ${name} = ${JSON.stringify(body)} as const\n`)
}
const header = "/* auto-generated: see scripts/extract-prompts.mjs */\n"
fs.writeFileSync(
  path.join(root, "lib/ai/prompt-generated.ts"),
  header + exports.join("\n"),
  "utf8"
)
console.log("Exports:", exports.length)
