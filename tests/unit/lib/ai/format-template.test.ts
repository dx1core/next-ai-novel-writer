import { describe, expect, it } from "vitest"
import { formatTemplate } from "@/lib/ai/format-template"

describe("formatTemplate", () => {
  it("replaces string placeholders", () => {
    expect(
      formatTemplate("Hello {name}, welcome to {place}.", {
        name: "Alice",
        place: "Wonderland",
      })
    ).toBe("Hello Alice, welcome to Wonderland.")
  })

  it("replaces numeric placeholders", () => {
    expect(
      formatTemplate("Chapter {index} has {count} words.", {
        index: 3,
        count: 2400,
      })
    ).toBe("Chapter 3 has 2400 words.")
  })

  it("leaves unknown placeholders unchanged", () => {
    expect(formatTemplate("Hello {name}, {unknown}", { name: "Alice" })).toBe(
      "Hello Alice, {unknown}"
    )
  })

  it("replaces repeated placeholders consistently", () => {
    expect(formatTemplate("{name}-{name}-{name}", { name: "hero" })).toBe(
      "hero-hero-hero"
    )
  })
})
