import { describe, expect, it } from "vitest"
import {
  defaultChapterInfo,
  getChapterInfoFromBlueprint,
  parseChapterBlueprint,
} from "@/lib/parsers/chapter-blueprint"

describe("chapter blueprint parser", () => {
  it("parses full chapter blocks", () => {
    const text = [
      "第2章 - [暗潮]",
      "本章定位：[冲突升级]",
      "核心作用：[揭露线索]",
      "悬念密度：[高]",
      "伏笔操作：[古镜异动]",
      "认知颠覆：[盟友身份反转]",
      "本章简述：[主角误入禁区]",
    ].join("\n")

    expect(parseChapterBlueprint(text)).toEqual([
      {
        chapterNumber: 2,
        chapterTitle: "暗潮",
        chapterRole: "冲突升级",
        chapterPurpose: "揭露线索",
        suspenseLevel: "高",
        foreshadowing: "古镜异动",
        plotTwistLevel: "盟友身份反转",
        chapterSummary: "主角误入禁区",
      },
    ])
  })

  it("fills missing fields with empty strings", () => {
    const text = ["第1章 - [序章]", "本章简述：[开端]"].join("\n")

    expect(parseChapterBlueprint(text)).toEqual([
      {
        chapterNumber: 1,
        chapterTitle: "序章",
        chapterRole: "",
        chapterPurpose: "",
        suspenseLevel: "",
        foreshadowing: "",
        plotTwistLevel: "",
        chapterSummary: "开端",
      },
    ])
  })

  it("skips invalid chunks and sorts chapter numbers", () => {
    const text = [
      "乱序文本",
      "",
      "第3章 - [终局]\n本章简述：[收束]",
      "",
      "第1章 - [开端]\n本章简述：[启程]",
    ].join("\n")

    expect(
      parseChapterBlueprint(text).map((item) => item.chapterNumber)
    ).toEqual([1, 3])
  })

  it("returns a parsed chapter when found", () => {
    const text = "第5章 - [回响]\n本章简述：[真相浮现]"

    expect(getChapterInfoFromBlueprint(text, 5)).toEqual({
      chapterNumber: 5,
      chapterTitle: "回响",
      chapterRole: "",
      chapterPurpose: "",
      suspenseLevel: "",
      foreshadowing: "",
      plotTwistLevel: "",
      chapterSummary: "真相浮现",
    })
  })

  it("returns fallback data when the target chapter is missing", () => {
    expect(getChapterInfoFromBlueprint("", 7)).toEqual({
      chapterNumber: 7,
      chapterTitle: "第7章",
      chapterRole: "",
      chapterPurpose: "",
      suspenseLevel: "",
      foreshadowing: "",
      plotTwistLevel: "",
      chapterSummary: "",
    })
  })

  it("returns stable default chapter info", () => {
    expect(defaultChapterInfo(9)).toEqual({
      chapterNumber: 9,
      chapterTitle: "第9章",
      chapterRole: "常规章节",
      chapterPurpose: "内容推进",
      suspenseLevel: "中等",
      foreshadowing: "无",
      plotTwistLevel: "★☆☆☆☆",
      chapterSummary: "",
    })
  })
})
