import { describe, expect, it } from "vitest"
import { checkBaseUrl, ensureOpenAiEmbeddingBaseUrl } from "@/lib/ai/base-url"

describe("base-url helpers", () => {
  it("returns empty string for blank input", () => {
    expect(checkBaseUrl("")).toBe("")
    expect(checkBaseUrl("   ")).toBe("")
  })

  it("strips trailing hash characters", () => {
    expect(checkBaseUrl("https://api.example.com###")).toBe(
      "https://api.example.com"
    )
  })

  it("appends v1 when version is missing", () => {
    expect(checkBaseUrl("https://api.example.com")).toBe(
      "https://api.example.com/v1"
    )
  })

  it("does not duplicate version suffixes", () => {
    expect(checkBaseUrl("https://api.example.com/v1")).toBe(
      "https://api.example.com/v1"
    )
    expect(checkBaseUrl("https://api.example.com/v2")).toBe(
      "https://api.example.com/v2"
    )
    expect(checkBaseUrl("https://api.example.com/openai/v1/chat")).toBe(
      "https://api.example.com/openai/v1/chat"
    )
  })

  it("normalizes trailing slashes before appending version", () => {
    expect(checkBaseUrl("https://api.example.com///")).toBe(
      "https://api.example.com/v1"
    )
  })

  it("reuses the same normalization for embedding urls", () => {
    expect(ensureOpenAiEmbeddingBaseUrl("https://api.example.com")).toBe(
      "https://api.example.com/v1"
    )
  })
})
