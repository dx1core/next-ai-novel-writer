import { getLlmAdapterWithFallback } from "@/lib/actions/project-llm"
import {
  computeChunkSize,
  limitChapterBlueprint,
} from "@/lib/ai/blueprint-math"
import { formatTemplate } from "@/lib/ai/format-template"
import { invokeWithCleaning } from "@/lib/ai/invoke"
import {
  chapter_blueprint_prompt,
  chunked_chapter_blueprint_prompt,
} from "@/lib/ai/prompt-generated"
import { prisma } from "@/lib/db"
import { getBlueprint, setBlueprintContent } from "@/lib/db/blueprint"

function maxChapterInBlueprint(text: string): number {
  const re = /第\s*(\d+)\s*章/g
  const nums: number[] = []
  let m: RegExpExecArray | null = null
  const s = text
  for (;;) {
    m = re.exec(s)
    if (m == null) {
      break
    }
    nums.push(Number.parseInt(m[1] ?? "0", 10))
  }
  return nums.length ? Math.max(...nums) : 0
}

export async function runBlueprintGeneration(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    throw new Error("项目不存在")
  }
  const arch = await prisma.novelArchitecture.findUnique({
    where: { projectId },
  })
  const architectureText = arch?.content?.trim() ?? ""
  if (!architectureText) {
    throw new Error("请先生成小说架构。")
  }

  const { adapter, config } = await getLlmAdapterWithFallback(
    projectId,
    "blueprint"
  )
  const userGuidance = project.userGuidance ?? ""
  const numberOfChapters = project.numChapters
  const maxTokens = config.maxTokens
  const chunkSize = computeChunkSize(numberOfChapters, maxTokens)

  const bp = await getBlueprint(projectId)
  const existingBlueprint = bp?.content?.trim() ?? ""

  if (existingBlueprint) {
    let finalBlueprint = existingBlueprint
    let currentStart = maxChapterInBlueprint(existingBlueprint) + 1
    while (currentStart <= numberOfChapters) {
      const currentEnd = Math.min(
        currentStart + chunkSize - 1,
        numberOfChapters
      )
      const limited = limitChapterBlueprint(finalBlueprint, 100)
      const prompt = formatTemplate(chunked_chapter_blueprint_prompt, {
        user_guidance: userGuidance,
        novel_architecture: architectureText,
        number_of_chapters: numberOfChapters,
        chapter_list: limited,
        n: currentStart,
        m: currentEnd,
      })
      const chunkResult = await invokeWithCleaning(adapter, prompt)
      if (!chunkResult.trim()) {
        await setBlueprintContent(projectId, finalBlueprint.trim())
        throw new Error(`分块生成失败 [${currentStart}..${currentEnd}]`)
      }
      finalBlueprint = `${finalBlueprint}\n\n${chunkResult.trim()}`
      await setBlueprintContent(projectId, finalBlueprint.trim())
      currentStart = currentEnd + 1
    }
    return { ok: true as const }
  }

  if (chunkSize >= numberOfChapters) {
    const prompt = formatTemplate(chapter_blueprint_prompt, {
      user_guidance: userGuidance,
      novel_architecture: architectureText,
      number_of_chapters: numberOfChapters,
    })
    const blueprintText = await invokeWithCleaning(adapter, prompt)
    if (!blueprintText.trim()) {
      throw new Error("章节目录生成结果为空")
    }
    await setBlueprintContent(projectId, blueprintText.trim())
    return { ok: true as const }
  }

  let finalBlueprint = ""
  let currentStart = 1
  while (currentStart <= numberOfChapters) {
    const currentEnd = Math.min(currentStart + chunkSize - 1, numberOfChapters)
    const limited = limitChapterBlueprint(finalBlueprint, 100)
    const prompt = formatTemplate(chunked_chapter_blueprint_prompt, {
      user_guidance: userGuidance,
      novel_architecture: architectureText,
      number_of_chapters: numberOfChapters,
      chapter_list: limited,
      n: currentStart,
      m: currentEnd,
    })
    const chunkResult = await invokeWithCleaning(adapter, prompt)
    if (!chunkResult.trim()) {
      await setBlueprintContent(projectId, finalBlueprint.trim())
      throw new Error(`分块生成失败 [${currentStart}..${currentEnd}]`)
    }
    finalBlueprint = finalBlueprint.trim()
      ? `${finalBlueprint}\n\n${chunkResult.trim()}`
      : chunkResult.trim()
    await setBlueprintContent(projectId, finalBlueprint.trim())
    currentStart = currentEnd + 1
  }

  return { ok: true as const }
}
