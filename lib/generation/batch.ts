import { prisma } from "@/lib/db"
import { runGenerateChapterDraft } from "@/lib/generation/chapter-prompt"
import { runEnrichChapter, runFinalizeChapter } from "@/lib/generation/finalize"

type Fields = {
  userGuidance: string
  charactersInvolved: string
  keyItems: string
  sceneLocation: string
  timeConstraint: string
}

export async function runBatchChapters(
  projectId: string,
  start: number,
  end: number,
  _wordTarget: number,
  minWords: number,
  autoEnrich: boolean,
  fields: Fields
) {
  const logs: string[] = []
  for (let i = start; i <= end; i++) {
    await runGenerateChapterDraft(projectId, i, fields, null)
    const row = await prisma.chapter.findUnique({
      where: { projectId_number: { projectId, number: i } },
    })
    let body = row?.draftContent ?? ""
    if (autoEnrich && body.length < 0.7 * minWords) {
      const enriched = await runEnrichChapter(projectId, i)
      if (enriched) {
        body = enriched
        await prisma.chapter.update({
          where: { projectId_number: { projectId, number: i } },
          data: { draftContent: enriched },
        })
      }
    }
    await runFinalizeChapter(projectId, i)
    logs.push(`第 ${i} 章完成`)
  }
  return logs
}
