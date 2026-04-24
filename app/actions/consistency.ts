"use server"

import { runConsistencyCheck } from "@/lib/generation/consistency"

export async function consistencyCheckAction(
  projectId: string,
  chapterNumber: number
) {
  try {
    const result = await runConsistencyCheck(projectId, chapterNumber)
    return { ok: true as const, result }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
