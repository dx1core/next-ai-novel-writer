"use server"

import { revalidatePath } from "next/cache"
import { getEmbeddingAdapterForProject } from "@/lib/actions/project-llm"
import { importKnowledgeText } from "@/lib/rag/knowledge"

export async function importKnowledgeAction(
  projectId: string,
  formData: FormData
) {
  const file = formData.get("file")
  if (!(file instanceof File) || !file.size) {
    return { ok: false as const, error: "请选择文件" }
  }
  try {
    const text = await file.text()
    const { adapter } = await getEmbeddingAdapterForProject(projectId)
    await importKnowledgeText(adapter, projectId, text)
    revalidatePath(`/${projectId}`)
    return { ok: true as const }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
