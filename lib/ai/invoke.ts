import type { LlmAdapter } from "./llm"

const THINK_RE = /<think>[\s\S]*?<\/think>/gi

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message)
  }
  return String(err)
}

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
    } catch (err) {
      console.error("[LLM] callWithRetry attempt failed", {
        attempt,
        maxRetries,
        error: serializeError(err),
      })
      if (attempt < maxRetries) {
        await sleep(sleepTimeMs)
      } else {
        console.error("[LLM] callWithRetry exhausted retries, using fallback")
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
  const urlLog = adapter.requestUrl ? { url: adapter.requestUrl } : {}
  let result = ""
  for (let i = 0; i < maxRetries; i++) {
    const attempt = i + 1
    try {
      result = await adapter.invoke(prompt)
      result = removeRedactedThinkTags(result)
      result = result.replaceAll("```", "").trim()
      if (result) {
        return result
      }
      console.warn("[LLM] invoke returned empty output after cleaning", {
        attempt,
        maxRetries,
        promptLength: prompt.length,
        ...urlLog,
      })
    } catch (err) {
      console.error("[LLM] invoke threw", {
        attempt,
        maxRetries,
        promptLength: prompt.length,
        error: serializeError(err),
        ...urlLog,
      })
      if (i === maxRetries - 1) {
        throw new Error("LLM invoke failed after retries")
      }
    }
  }
  console.error("[LLM] invoke failed: empty response after all retries", {
    maxRetries,
    promptLength: prompt.length,
    ...urlLog,
  })
  throw new Error("LLM invoke failed after retries")
}
