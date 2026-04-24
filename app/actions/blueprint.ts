"use server"

import { revalidatePath } from "next/cache"
import { runBlueprintGeneration } from "@/lib/generation/blueprint"

export async function generateChapterBlueprintAction(projectId: string) {
  try {
    await runBlueprintGeneration(projectId)
    revalidatePath(`/${projectId}`)
    return { ok: true as const }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
