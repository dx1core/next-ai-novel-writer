import {
  getEmbeddingAdapterForProject,
  getLlmAdapterWithFallback,
} from "@/lib/actions/project-llm"
import { formatTemplate } from "@/lib/ai/format-template"
import { invokeWithCleaning } from "@/lib/ai/invoke"
import { createLlmAdapter } from "@/lib/ai/llm"
import {
  summary_prompt,
  update_character_state_prompt,
} from "@/lib/ai/prompt-generated"
import { prisma } from "@/lib/db"
import { getChapter, setChapterFinal } from "@/lib/db/chapters"
import { getLlmRow, rowToLlmConfig } from "@/lib/db/profiles"
import {
  getCharacterState,
  getGlobalSummary,
  setCharacterStateContent,
  setGlobalSummaryContent,
} from "@/lib/db/state"
import { addChapterSegmentsToVectorStore } from "@/lib/rag/vectorstore"
export async function runEnrichChapter(projectId: string, novelNumber: number) {
  const row = await getChapter(projectId, novelNumber)
  if (!row?.draftContent?.trim()) {
    return null
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return null
  }
  const s = await prisma.projectSettings.findUnique({ where: { projectId } })
  const draftLlm = s?.draftLlmId ? await getLlmRow(s.draftLlmId) : null
  if (!draftLlm) {
    return null
  }
  const adapter = createLlmAdapter(rowToLlmConfig(draftLlm))
  const w = project.wordNumber
  const p = `以下章节文本较短，请在保持剧情连贯的前提下进行扩写，使其更充实，接近 ${w} 字左右，仅给出最终文本，不要解释任何内容。：
原内容：
${row.draftContent}`
  const out = await invokeWithCleaning(adapter, p, 3)
  return out || row.draftContent
}

export async function runFinalizeChapter(
  projectId: string,
  novelNumber: number
) {
  const row = await getChapter(projectId, novelNumber)
  const text = (row?.draftContent ?? row?.finalContent ?? "").trim()
  if (!text) {
    throw new Error("当前章节无内容，无法定稿。")
  }

  const gs = await getGlobalSummary(projectId)
  const oldSummary = gs?.content ?? ""
  const st = await getCharacterState(projectId)
  const oldState = st?.content ?? ""

  const { adapter } = await getLlmAdapterWithFallback(projectId, "finalize")

  const sPrompt = formatTemplate(summary_prompt, {
    chapter_text: text,
    global_summary: oldSummary,
  })
  const newSummary =
    (await invokeWithCleaning(adapter, sPrompt, 3)).trim() || oldSummary

  const cPrompt = formatTemplate(update_character_state_prompt, {
    chapter_text: text,
    old_state: oldState,
  })
  const newState =
    (await invokeWithCleaning(adapter, cPrompt, 3)).trim() || oldState

  await setGlobalSummaryContent(projectId, newSummary)
  await setCharacterStateContent(projectId, newState)
  await setChapterFinal(projectId, novelNumber, text)

  const { adapter: emb } = await getEmbeddingAdapterForProject(projectId)
  await addChapterSegmentsToVectorStore(emb, projectId, text)

  return { ok: true as const }
}
