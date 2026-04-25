import { describe, expect, it } from "vitest"
import {
  applyContentRules,
  applyKnowledgeRules,
  buildNextChapterInfoDefaults,
  extractSummaryFromResponse,
  formatChapterInfoForFilter,
  parseSearchKeywords,
} from "@/lib/ai/chapter-helpers"

describe("chapter helpers", () => {
  it("extracts summary from known markers", () => {
    expect(extractSummaryFromResponse("当前章节摘要: 主角发现线索")).toBe(
      "主角发现线索"
    )
    expect(extractSummaryFromResponse("本章摘要: 真相浮现")).toBe("真相浮现")
  })

  it("falls back to trimmed content when marker is missing", () => {
    expect(extractSummaryFromResponse("  直接返回的摘要  ")).toBe(
      "直接返回的摘要"
    )
  })

  it("parses only dotted keyword lines and limits to five entries", () => {
    const response = [
      "· 世界观",
      "· 设定背景",
      "普通行",
      "· 人物关系",
      "· 关键地点",
      "· 关键道具",
      "· 多余条目",
    ].join("\n")

    expect(parseSearchKeywords(response)).toEqual([
      "世界观",
      "设定背景",
      "人物关系",
      "关键地点",
      "关键道具",
    ])
  })

  it("applies content rules based on chapter distance", () => {
    const result = applyContentRules(
      [
        "第9章 主角刚脱险",
        "chapter_7 old event",
        "第1章 久远伏笔",
        "世界设定：古老王朝",
      ],
      10
    )

    expect(result[0]).toContain("[SKIP]")
    expect(result[1]).toContain("[MOD40%]")
    expect(result[2]).toContain("[OK]")
    expect(result[3]).toContain("[PRIOR]")
  })

  it("applies knowledge rules to historical chapters and external knowledge", () => {
    const result = applyKnowledgeRules(
      ["第 8 章 回顾旧事件", "外部资料：古剑设定"],
      { chapterNumber: 10 }
    )

    expect(result[0]).toContain("[历史章节限制]")
    expect(result[1]).toContain("[外部知识]")
  })

  it("formats chapter info with fallbacks for missing extras", () => {
    const text = formatChapterInfoForFilter(
      {
        chapterNumber: 3,
        chapterTitle: "暗潮",
        chapterRole: "推进",
        chapterPurpose: "埋下伏笔",
        suspenseLevel: "高",
        foreshadowing: "古镜",
        plotTwistLevel: "★★★☆☆",
        chapterSummary: "主角误入禁区",
      },
      {
        charactersInvolved: "",
        keyItems: "",
        sceneLocation: "",
      }
    )

    expect(text).toContain("章节编号：第3章")
    expect(text).toContain("主要人物：未指定")
    expect(text).toContain("关键道具：未指定")
    expect(text).toContain("场景地点：未指定")
  })

  it("builds defaults for the next chapter", () => {
    expect(buildNextChapterInfoDefaults(8)).toEqual({
      chapterNumber: 8,
      chapterTitle: "（未命名）",
      chapterRole: "过渡章节",
      chapterPurpose: "承上启下",
      suspenseLevel: "中等",
      foreshadowing: "无特殊伏笔",
      plotTwistLevel: "★☆☆☆☆",
      chapterSummary: "衔接过渡内容",
    })
  })
})
