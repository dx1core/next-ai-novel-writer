import type { ChapterBlueprintInfo } from "@/lib/types"

const headerRe = /^第\s*(\d+)\s*章\s*-\s*\[?(.*?)\]?$/
const roleRe = /^本章定位：\s*\[?(.*?)\]?$/
const purposeRe = /^核心作用：\s*\[?(.*?)\]?$/
const suspenseRe = /^悬念密度：\s*\[?(.*?)\]?$/
const foreRe = /^伏笔操作：\s*\[?(.*?)\]?$/
const twistRe = /^认知颠覆：\s*\[?(.*?)\]?$/
const summaryRe = /^本章简述：\s*\[?(.*?)\]?$/

/**
 * Parse full `Novel_directory` style text into per-chapter records.
 * Mirrors `chapter_directory_parser.py`.
 */
export function parseChapterBlueprint(
  blueprintText: string
): ChapterBlueprintInfo[] {
  const chunks = blueprintText.trim().split(/\n\s*\n/)
  const results: ChapterBlueprintInfo[] = []

  for (const chunk of chunks) {
    const lines = chunk
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      continue
    }
    const header = headerRe.exec(lines[0] ?? "")
    if (!header) {
      continue
    }
    const chapterNumber = Number.parseInt(header[1] ?? "0", 10)
    const chapterTitle = (header[2] ?? "").trim()
    let chapterRole = ""
    let chapterPurpose = ""
    let suspenseLevel = ""
    let foreshadowing = ""
    let plotTwistLevel = ""
    let chapterSummary = ""
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] ?? ""
      const r1 = roleRe.exec(line)
      if (r1) {
        chapterRole = (r1[1] ?? "").trim()
        continue
      }
      const r2 = purposeRe.exec(line)
      if (r2) {
        chapterPurpose = (r2[1] ?? "").trim()
        continue
      }
      const r3 = suspenseRe.exec(line)
      if (r3) {
        suspenseLevel = (r3[1] ?? "").trim()
        continue
      }
      const r4 = foreRe.exec(line)
      if (r4) {
        foreshadowing = (r4[1] ?? "").trim()
        continue
      }
      const r5 = twistRe.exec(line)
      if (r5) {
        plotTwistLevel = (r5[1] ?? "").trim()
        continue
      }
      const r6 = summaryRe.exec(line)
      if (r6) {
        chapterSummary = (r6[1] ?? "").trim()
      }
    }
    results.push({
      chapterNumber,
      chapterTitle,
      chapterRole,
      chapterPurpose,
      suspenseLevel,
      foreshadowing,
      plotTwistLevel,
      chapterSummary,
    })
  }
  results.sort((a, b) => a.chapterNumber - b.chapterNumber)
  return results
}

export function getChapterInfoFromBlueprint(
  blueprintText: string,
  targetChapterNumber: number
): ChapterBlueprintInfo {
  const all = parseChapterBlueprint(blueprintText)
  const ch = all.find((c) => c.chapterNumber === targetChapterNumber)
  if (ch) {
    return ch
  }
  return {
    chapterNumber: targetChapterNumber,
    chapterTitle: `第${targetChapterNumber}章`,
    chapterRole: "",
    chapterPurpose: "",
    suspenseLevel: "",
    foreshadowing: "",
    plotTwistLevel: "",
    chapterSummary: "",
  }
}

export function defaultChapterInfo(n: number): ChapterBlueprintInfo {
  return {
    chapterNumber: n,
    chapterTitle: `第${n}章`,
    chapterRole: "常规章节",
    chapterPurpose: "内容推进",
    suspenseLevel: "中等",
    foreshadowing: "无",
    plotTwistLevel: "★☆☆☆☆",
    chapterSummary: "",
  }
}
