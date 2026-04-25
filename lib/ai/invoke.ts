import type { LlmAdapter } from "./llm"

const THINK_RE = /<think>[\s\S]*?<\/think>/gi

function removeRedactedThinkTags(text: string): string {
  return text.replace(THINK_RE, "")
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  sleepTimeMs = 2000,
  fallback: T
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (_e) {
      if (attempt < maxRetries) {
        await sleep(sleepTimeMs)
      } else {
        return fallback
      }
    }
  }
  return fallback
}

/**
 * Call LLM, strip code fences, trim. Retries on empty/throw up to `maxRetries`.
 */
export async function invokeWithCleaning(
  adapter: LlmAdapter,
  prompt: string,
  maxRetries = 3
): Promise<string> {
  let result = ""
  for (let i = 0; i < maxRetries; i++) {
    try {
      result = await adapter.invoke(prompt)
      result = removeRedactedThinkTags(result)
      result = result.replaceAll("```", "").trim()
      if (result) {
        return result
      }
    } catch {
      if (i === maxRetries - 1) {
        throw new Error("LLM invoke failed after retries")
      }
    }
  }
  throw new Error("LLM invoke failed after retries")
}
