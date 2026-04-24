/** Shared app types (generation pipeline). */

import type { ChapterStatus } from "@/generated/prisma/enums"

export type { ChapterStatus }

export type LlmProfileConfig = {
  name: string
  interfaceFormat: string
  apiKey: string
  baseUrl: string
  modelName: string
  temperature: number
  maxTokens: number
  timeout: number
}

export type EmbeddingProfileConfig = {
  name: string
  interfaceFormat: string
  apiKey: string
  baseUrl: string
  modelName: string
  retrievalK: number
}

/** Matches `partial_architecture.json` keys from the Python app. */
export type PartialArchitectureData = {
  core_seed_result?: string
  character_dynamics_result?: string
  character_state_result?: string
  world_building_result?: string
  plot_arch_result?: string
}

export type ChapterBlueprintInfo = {
  chapterNumber: number
  chapterTitle: string
  chapterRole: string
  chapterPurpose: string
  suspenseLevel: string
  foreshadowing: string
  plotTwistLevel: string
  chapterSummary: string
}

export type GenerationLog = {
  level: "info" | "warn" | "error"
  message: string
  at: string
}

export type ActionResult<T> =
  | {
      ok: true
      data: T
    }
  | { ok: false; error: string; logs: GenerationLog[] }
