"use server"

import { revalidatePath } from "next/cache"
import { runArchitectureGeneration } from "@/lib/generation/architecture"

export async function generateNovelArchitectureAction(projectId: string) {
  try {
    const r = await runArchitectureGeneration(projectId)
    revalidatePath(`/${projectId}`)
    return { ok: true as const, model: r.model }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
