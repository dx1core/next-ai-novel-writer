import { describe, expect, it } from "vitest"
import {
  computeChunkSize,
  limitChapterBlueprint,
} from "@/lib/ai/blueprint-math"

describe("blueprint math", () => {
  it("clamps chunk size to at least one", () => {
    expect(computeChunkSize(20, 50)).toBe(1)
  })

  it("caps chunk size at the chapter count", () => {
    expect(computeChunkSize(5, 10_000)).toBe(5)
  })

  it("calculates a normal chunk size", () => {
    expect(computeChunkSize(100, 8_000)).toBe(30)
  })

  it("returns original blueprint when within the limit", () => {
    const text = "第1章 - [序章]\n本章简述：[开场]"
    expect(limitChapterBlueprint(text, 5)).toBe(text)
  })

  it("returns the last limited number of chapters when exceeding the limit", () => {
    const text = [
      "第1章 - [一]\n本章简述：[一]",
      "第2章 - [二]\n本章简述：[二]",
      "第3章 - [三]\n本章简述：[三]",
    ].join("\n\n")

    expect(limitChapterBlueprint(text, 2)).toBe(
      ["第2章 - [二]\n本章简述：[二]", "第3章 - [三]\n本章简述：[三]"].join(
        "\n\n"
      )
    )
  })

  it("keeps empty or invalid blueprint text stable", () => {
    expect(limitChapterBlueprint("", 2)).toBe("")
    expect(limitChapterBlueprint("没有有效章节", 2)).toBe("没有有效章节")
  })
})
