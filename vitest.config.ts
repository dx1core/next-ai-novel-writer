import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const rootDir = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "app/actions/chapter.ts",
        "lib/actions/project-llm.ts",
        "lib/ai/base-url.ts",
        "lib/ai/blueprint-math.ts",
        "lib/ai/chapter-helpers.ts",
        "lib/ai/format-template.ts",
        "lib/ai/invoke.ts",
        "lib/db/architecture.ts",
        "lib/db/vector-entries.ts",
        "lib/parsers/chapter-blueprint.ts",
        "lib/rag/knowledge.ts",
        "lib/rag/vectorstore.ts",
      ],
      exclude: ["tests/**"],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
})
