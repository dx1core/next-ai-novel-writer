import { describe, expect, it, vi } from "vitest"
import { callWithRetry, invokeWithCleaning } from "@/lib/ai/invoke"

describe("invoke helpers", () => {
  it("stops retrying after the first successful call", async () => {
    const fn = vi.fn().mockResolvedValue("ok")

    await expect(callWithRetry(fn, 3, 10, "fallback")).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("returns fallback after repeated failures and waits between retries", async () => {
    vi.useFakeTimers()
    const fn = vi.fn().mockRejectedValue(new Error("boom"))
    const promise = callWithRetry(fn, 3, 50, "fallback")

    await vi.runAllTimersAsync()

    await expect(promise).resolves.toBe("fallback")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("cleans think tags and code fences from adapter output", async () => {
    const adapter = {
      invoke: vi
        .fn()
        .mockResolvedValue("<think>internal</think>\n```最终正文```"),
    }

    await expect(invokeWithCleaning(adapter, "prompt", 2)).resolves.toBe(
      "最终正文"
    )
  })

  it("retries empty responses and then throws", async () => {
    const adapter = {
      invoke: vi.fn().mockResolvedValue("   "),
    }

    await expect(invokeWithCleaning(adapter, "prompt", 2)).rejects.toThrow(
      "LLM invoke failed after retries"
    )
    expect(adapter.invoke).toHaveBeenCalledTimes(2)
  })

  it("throws after repeated adapter errors", async () => {
    const adapter = {
      invoke: vi.fn().mockRejectedValue(new Error("network")),
    }

    await expect(invokeWithCleaning(adapter, "prompt", 2)).rejects.toThrow(
      "LLM invoke failed after retries"
    )
    expect(adapter.invoke).toHaveBeenCalledTimes(2)
  })
})
