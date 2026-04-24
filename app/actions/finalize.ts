"use server"

import { revalidatePath } from "next/cache"
import { runFinalizeChapter } from "@/lib/generation/finalize"

export async function finalizeChapterAction(
  projectId: string,
  novelNumber: number
) {
  try {
    await runFinalizeChapter(projectId, novelNumber)
    revalidatePath(`/${projectId}`)
    revalidatePath(`/${projectId}/chapters/${novelNumber}`)
    return { ok: true as const }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
