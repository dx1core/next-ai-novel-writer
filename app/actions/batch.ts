"use server"

import { revalidatePath } from "next/cache"
import { runBatchChapters } from "@/lib/generation/batch"

type Fields = {
  userGuidance: string
  charactersInvolved: string
  keyItems: string
  sceneLocation: string
  timeConstraint: string
}

export async function batchChaptersAction(
  projectId: string,
  start: number,
  end: number,
  wordTarget: number,
  minWords: number,
  autoEnrich: boolean,
  fields: Fields
) {
  try {
    const logs = await runBatchChapters(
      projectId,
      start,
      end,
      wordTarget,
      minWords,
      autoEnrich,
      fields
    )
    revalidatePath(`/${projectId}`)
    return { ok: true as const, logs }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
