import { getLlmAdapterWithFallback } from "@/lib/actions/project-llm"
import { formatTemplate } from "@/lib/ai/format-template"
import { invokeWithCleaning } from "@/lib/ai/invoke"
import { CONSISTENCY_PROMPT } from "@/lib/ai/prompts/consistency-prompt"
import { prisma } from "@/lib/db"
import { getChapter } from "@/lib/db/chapters"

export async function runConsistencyCheck(
  projectId: string,
  chapterNumber: number
) {
  const chapter = await getChapter(projectId, chapterNumber)
  const chapterText = chapter?.draftContent ?? chapter?.finalContent ?? ""
  if (!chapterText.trim()) {
    throw new Error("当前章节无内容。")
  }
  const arch = await prisma.novelArchitecture.findUnique({
    where: { projectId },
  })
  const st = await prisma.characterState.findUnique({ where: { projectId } })
  const gs = await prisma.globalSummary.findUnique({ where: { projectId } })
  const pa = await prisma.plotArcs.findUnique({ where: { projectId } })

  const { adapter } = await getLlmAdapterWithFallback(projectId, "consistency")
  const prompt = formatTemplate(CONSISTENCY_PROMPT, {
    novel_setting: arch?.content ?? "",
    character_state: st?.content ?? "",
    global_summary: gs?.content ?? "",
    plot_arcs: pa?.content ?? "",
    chapter_text: chapterText,
  })
  return invokeWithCleaning(adapter, prompt, 3)
}
