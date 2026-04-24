import {
  getEmbeddingAdapterForProject,
  getLlmAdapterWithFallback,
} from "@/lib/actions/project-llm"
import {
  applyContentRules,
  applyKnowledgeRules,
  buildNextChapterInfoDefaults,
  extractSummaryFromResponse,
  formatChapterInfoForFilter,
  parseSearchKeywords,
} from "@/lib/ai/chapter-helpers"
import { formatTemplate } from "@/lib/ai/format-template"
import { invokeWithCleaning } from "@/lib/ai/invoke"
import {
  first_chapter_draft_prompt,
  knowledge_filter_prompt,
  knowledge_search_prompt,
  next_chapter_draft_prompt,
  summarize_recent_chapters_prompt,
} from "@/lib/ai/prompt-generated"
import { prisma } from "@/lib/db"
import { getChapterTextForRag, upsertChapterDraft } from "@/lib/db/chapters"
import {
  defaultChapterInfo,
  getChapterInfoFromBlueprint,
} from "@/lib/parsers/chapter-blueprint"
import { getRelevantContextFromVectorStore } from "@/lib/rag/vectorstore"
import type { ChapterBlueprintInfo } from "@/lib/types"

type ChapterFields = {
  userGuidance: string
  charactersInvolved: string
  keyItems: string
  sceneLocation: string
  timeConstraint: string
}

export async function buildChapterPromptText(
  projectId: string,
  novelNumber: number,
  fields: ChapterFields
): Promise<string> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    throw new Error("项目不存在")
  }
  const arch = await prisma.novelArchitecture.findUnique({
    where: { projectId },
  })
  const blueprint = await prisma.chapterBlueprint.findUnique({
    where: { projectId },
  })
  const gs = await prisma.globalSummary.findUnique({ where: { projectId } })
  const cs = await prisma.characterState.findUnique({ where: { projectId } })
  const blueprintText = blueprint?.content ?? ""
  const novelArchitectureText = arch?.content ?? ""
  const globalSummaryText = gs?.content ?? ""
  const characterStateText = cs?.content ?? ""

  let chapterInfo = getChapterInfoFromBlueprint(blueprintText, novelNumber)
  if (!chapterInfo.chapterTitle) {
    chapterInfo = defaultChapterInfo(novelNumber)
  }
  const nextNum = novelNumber + 1
  let nextChapterInfo: ChapterBlueprintInfo = getChapterInfoFromBlueprint(
    blueprintText,
    nextNum
  )
  if (!nextChapterInfo.chapterTitle) {
    nextChapterInfo = buildNextChapterInfoDefaults(nextNum)
  }

  if (novelNumber === 1) {
    return formatTemplate(first_chapter_draft_prompt, {
      novel_number: novelNumber,
      word_number: project.wordNumber,
      chapter_title: chapterInfo.chapterTitle,
      chapter_role: chapterInfo.chapterRole,
      chapter_purpose: chapterInfo.chapterPurpose,
      suspense_level: chapterInfo.suspenseLevel,
      foreshadowing: chapterInfo.foreshadowing,
      plot_twist_level: chapterInfo.plotTwistLevel,
      chapter_summary: chapterInfo.chapterSummary,
      characters_involved: fields.charactersInvolved,
      key_items: fields.keyItems,
      scene_location: fields.sceneLocation,
      time_constraint: fields.timeConstraint,
      user_guidance: fields.userGuidance,
      novel_setting: novelArchitectureText,
    })
  }

  const { adapter } = await getLlmAdapterWithFallback(projectId, "draft")
  const recentTexts = await getChapterTextForRag(projectId, novelNumber, 3)
  const combined = recentTexts.join("\n")
  const combinedLimited =
    combined.length > 4000 ? combined.slice(-4000) : combined
  const sumPrompt = formatTemplate(summarize_recent_chapters_prompt, {
    combined_text: combinedLimited,
    novel_number: novelNumber,
    chapter_title: chapterInfo.chapterTitle,
    chapter_role: chapterInfo.chapterRole,
    chapter_purpose: chapterInfo.chapterPurpose,
    suspense_level: chapterInfo.suspenseLevel,
    foreshadowing: chapterInfo.foreshadowing,
    plot_twist_level: chapterInfo.plotTwistLevel,
    chapter_summary: chapterInfo.chapterSummary,
    next_chapter_number: nextNum,
    next_chapter_title: nextChapterInfo.chapterTitle,
    next_chapter_role: nextChapterInfo.chapterRole,
    next_chapter_purpose: nextChapterInfo.chapterPurpose,
    next_chapter_suspense_level: nextChapterInfo.suspenseLevel,
    next_chapter_foreshadowing: nextChapterInfo.foreshadowing,
    next_chapter_plot_twist_level: nextChapterInfo.plotTwistLevel,
    next_chapter_summary: nextChapterInfo.chapterSummary,
  })
  const sumOut = await invokeWithCleaning(adapter, sumPrompt, 3)
  const shortSummary = (extractSummaryFromResponse(sumOut) || sumOut).slice(
    0,
    2000
  )

  let previousExcerpt = ""
  for (const t of [...recentTexts].reverse()) {
    if (t.trim()) {
      previousExcerpt = t.length > 800 ? t.slice(-800) : t
      break
    }
  }

  const searchPrompt = formatTemplate(knowledge_search_prompt, {
    chapter_number: novelNumber,
    chapter_title: chapterInfo.chapterTitle,
    characters_involved: fields.charactersInvolved,
    key_items: fields.keyItems,
    scene_location: fields.sceneLocation,
    chapter_role: chapterInfo.chapterRole,
    chapter_purpose: chapterInfo.chapterPurpose,
    foreshadowing: chapterInfo.foreshadowing,
    short_summary: shortSummary,
    user_guidance: fields.userGuidance,
    time_constraint: fields.timeConstraint,
  })
  const searchResp = await invokeWithCleaning(adapter, searchPrompt, 3)
  const groups = parseSearchKeywords(searchResp)

  const { adapter: embAdapter, config: embConfig } =
    await getEmbeddingAdapterForProject(projectId)
  const allCtx: string[] = []
  for (const g of groups) {
    const ctx = await getRelevantContextFromVectorStore(
      embAdapter,
      projectId,
      g,
      embConfig.retrievalK
    )
    if (ctx) {
      const low = g.toLowerCase()
      if (
        low.includes("技法") ||
        low.includes("手法") ||
        low.includes("模板")
      ) {
        allCtx.push(`[TECHNIQUE] ${ctx}`)
      } else if (
        low.includes("设定") ||
        low.includes("技术") ||
        low.includes("世界观")
      ) {
        allCtx.push(`[SETTING] ${ctx}`)
      } else {
        allCtx.push(`[GENERAL] ${ctx}`)
      }
    }
  }
  const processed = applyContentRules(allCtx, novelNumber)
  const chForFilter: ChapterBlueprintInfo = chapterInfo
  const afterKnow = applyKnowledgeRules(processed, {
    chapterNumber: novelNumber,
  })
  const formatted = formatChapterInfoForFilter(chForFilter, {
    charactersInvolved: fields.charactersInvolved,
    keyItems: fields.keyItems,
    sceneLocation: fields.sceneLocation,
  })
  const prepped = afterKnow
    .map((t, i) => {
      const m = t.length > 600 ? `${t.slice(0, 600)}...` : t
      return `[预处理结果${i + 1}]\n${m}`
    })
    .join("\n\n")
  const filterPrompt = formatTemplate(knowledge_filter_prompt, {
    retrieved_texts: prepped || "（无检索结果）",
    chapter_info: formatted,
  })
  const filterOut = await invokeWithCleaning(adapter, filterPrompt, 3)
  const filteredContext = filterOut.trim() || "（知识内容过滤失败）"

  return formatTemplate(next_chapter_draft_prompt, {
    user_guidance: fields.userGuidance || "无特殊指导",
    global_summary: globalSummaryText,
    previous_chapter_excerpt: previousExcerpt,
    character_state: characterStateText,
    short_summary: shortSummary,
    novel_number: novelNumber,
    chapter_title: chapterInfo.chapterTitle,
    chapter_role: chapterInfo.chapterRole,
    chapter_purpose: chapterInfo.chapterPurpose,
    suspense_level: chapterInfo.suspenseLevel,
    foreshadowing: chapterInfo.foreshadowing,
    plot_twist_level: chapterInfo.plotTwistLevel,
    chapter_summary: chapterInfo.chapterSummary,
    word_number: project.wordNumber,
    characters_involved: fields.charactersInvolved,
    key_items: fields.keyItems,
    scene_location: fields.sceneLocation,
    time_constraint: fields.timeConstraint,
    next_chapter_number: nextNum,
    next_chapter_title: nextChapterInfo.chapterTitle,
    next_chapter_role: nextChapterInfo.chapterRole,
    next_chapter_purpose: nextChapterInfo.chapterPurpose,
    next_chapter_suspense_level: nextChapterInfo.suspenseLevel,
    next_chapter_foreshadowing: nextChapterInfo.foreshadowing,
    next_chapter_plot_twist_level: nextChapterInfo.plotTwistLevel,
    next_chapter_summary: nextChapterInfo.chapterSummary,
    filtered_context: filteredContext,
  })
}

export async function runGenerateChapterDraft(
  projectId: string,
  novelNumber: number,
  fields: ChapterFields,
  customPrompt: string | null
) {
  const prompt =
    customPrompt?.trim() ||
    (await buildChapterPromptText(projectId, novelNumber, fields))
  const { adapter } = await getLlmAdapterWithFallback(projectId, "draft")
  const text = await invokeWithCleaning(adapter, prompt, 3)
  if (!text.trim()) {
    throw new Error("章节草稿生成结果为空")
  }
  await upsertChapterDraft(projectId, novelNumber, text)
  return text
}
