"use server"

import { revalidatePath } from "next/cache"
import {
  buildChapterPromptText,
  runGenerateChapterDraft,
} from "@/lib/generation/chapter-prompt"

type Fields = {
  userGuidance: string
  charactersInvolved: string
  keyItems: string
  sceneLocation: string
  timeConstraint: string
}

export async function buildChapterPromptAction(
  projectId: string,
  novelNumber: number,
  fields: Fields
) {
  try {
    const prompt = await buildChapterPromptText(projectId, novelNumber, fields)
    return { ok: true as const, prompt }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function generateChapterDraftAction(
  projectId: string,
  novelNumber: number,
  fields: Fields,
  customPrompt: string | null
) {
  try {
    const text = await runGenerateChapterDraft(
      projectId,
      novelNumber,
      fields,
      customPrompt
    )
    revalidatePath(`/${projectId}`)
    revalidatePath(`/${projectId}/chapters/${novelNumber}`)
    return { ok: true as const, text }
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
