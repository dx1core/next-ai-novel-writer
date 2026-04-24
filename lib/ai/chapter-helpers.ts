import type { ChapterBlueprintInfo } from "@/lib/types"
import { formatTemplate } from "./format-template"

const SUMMARY_MARKERS = ["当前章节摘要:", "章节摘要:", "摘要:", "本章摘要:"]

export function extractSummaryFromResponse(responseText: string): string {
  if (!responseText) {
    return ""
  }
  for (const m of SUMMARY_MARKERS) {
    if (responseText.includes(m)) {
      const parts = responseText.split(m, 2)
      if (parts[1]) {
        return parts[1].trim()
      }
    }
  }
  return responseText.trim()
}

export function parseSearchKeywords(responseText: string): string[] {
  return responseText
    .trim()
    .split("\n")
    .filter((line) => line.includes("·"))
    .map((line) => line.replaceAll("·", " ").trim())
    .slice(0, 5)
}

export function applyContentRules(
  texts: string[],
  novelNumber: number
): string[] {
  const out: string[] = []
  for (const text of texts) {
    if (/第[\d]+章/.test(text) || /chapter_[\d]+/.test(text)) {
      const nums = text.match(/\d+/g)?.map(Number) ?? []
      const recentChap = nums.length ? Math.max(...nums) : 0
      const timeDistance = novelNumber - recentChap
      if (timeDistance <= 2) {
        out.push(`[SKIP] 跳过近章内容：${text.slice(0, 120)}...`)
      } else if (timeDistance >= 3 && timeDistance <= 5) {
        out.push(`[MOD40%] ${text}（需修改≥40%）`)
      } else {
        out.push(`[OK] ${text}（可引用核心）`)
      }
    } else {
      out.push(`[PRIOR] ${text}（优先使用）`)
    }
  }
  return out
}

export function applyKnowledgeRules(
  texts: string[],
  chapterInfo: { chapterNumber: number }
): string[] {
  const chapterNum = chapterInfo.chapterNumber
  const processed: string[] = []
  for (const text of texts) {
    if (text.includes("第") && text.includes("章")) {
      const nums = text
        .split(/\s+/)
        .filter((s) => /^\d+$/.test(s))
        .map(Number)
      const recentChap = nums.length ? Math.max(...nums) : 0
      const timeDistance = chapterNum - recentChap
      if (timeDistance <= 3) {
        processed.push(`[历史章节限制] 跳过近期内容: ${text.slice(0, 50)}...`)
        continue
      }
      processed.push(`[历史参考] ${text} (需进行30%以上改写)`)
    } else {
      processed.push(`[外部知识] ${text}`)
    }
  }
  return processed
}

type ChapterFilterExtras = {
  charactersInvolved: string
  keyItems: string
  sceneLocation: string
}

export function formatChapterInfoForFilter(
  ch: ChapterBlueprintInfo,
  extras: ChapterFilterExtras
) {
  return formatTemplate(
    `
章节编号：第{number}章
章节标题：《{title}》
章节定位：{role}
核心作用：{purpose}
主要人物：{characters}
关键道具：{items}
场景地点：{location}
伏笔设计：{foreshadow}
悬念密度：{suspense}
转折程度：{twist}
章节简述：{summary}
`,
    {
      number: ch.chapterNumber,
      title: ch.chapterTitle,
      role: ch.chapterRole,
      purpose: ch.chapterPurpose,
      characters: extras.charactersInvolved || "未指定",
      items: extras.keyItems || "未指定",
      location: extras.sceneLocation || "未指定",
      foreshadow: ch.foreshadowing,
      suspense: ch.suspenseLevel,
      twist: ch.plotTwistLevel,
      summary: ch.chapterSummary,
    }
  )
}

export function buildNextChapterInfoDefaults(n: number): ChapterBlueprintInfo {
  return {
    chapterNumber: n,
    chapterTitle: "（未命名）",
    chapterRole: "过渡章节",
    chapterPurpose: "承上启下",
    suspenseLevel: "中等",
    foreshadowing: "无特殊伏笔",
    plotTwistLevel: "★☆☆☆☆",
    chapterSummary: "衔接过渡内容",
  }
}
