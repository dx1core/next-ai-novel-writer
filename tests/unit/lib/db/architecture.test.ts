import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {},
}))

import { parsePartialJson } from "@/lib/db/architecture"

describe("parsePartialJson", () => {
  it("returns empty object for blank strings", () => {
    expect(parsePartialJson("")).toEqual({})
    expect(parsePartialJson("   ")).toEqual({})
  })

  it("parses valid json", () => {
    expect(
      parsePartialJson('{"core_seed_result":"seed","plot_arch_result":"plot"}')
    ).toEqual({
      core_seed_result: "seed",
      plot_arch_result: "plot",
    })
  })

  it("returns empty object for invalid json", () => {
    expect(parsePartialJson("{oops")).toEqual({})
  })
})
