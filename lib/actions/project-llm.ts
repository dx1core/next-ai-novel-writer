import { createEmbeddingAdapter } from "@/lib/ai/embedding"
import { createLlmAdapter } from "@/lib/ai/llm"
import { prisma } from "@/lib/db"
import {
  getEmbeddingRow,
  getLlmRow,
  getProjectSettings,
  rowToEmbeddingConfig,
  rowToLlmConfig,
} from "@/lib/db/profiles"
import type { EmbeddingProfileConfig } from "@/lib/types"

export type GenStep =
  | "architecture"
  | "blueprint"
  | "draft"
  | "finalize"
  | "consistency"

function stepField(
  s: Awaited<ReturnType<typeof getProjectSettings>>,
  step: GenStep
) {
  if (!s) {
    return null
  }
  const map: Record<GenStep, string | null | undefined> = {
    architecture: s.architectureLlmId,
    blueprint: s.blueprintLlmId,
    draft: s.draftLlmId,
    finalize: s.finalizeLlmId,
    consistency: s.consistencyLlmId,
  }
  return map[step] ?? null
}

export async function getLlmAdapterForProject(
  projectId: string,
  step: GenStep
) {
  const s = await getProjectSettings(projectId)
  const id = stepField(s, step)
  const row = await getLlmRow(id)
  if (!row) {
    throw new Error(
      `请先在项目设置中为此步骤选择 LLM 配置（${step}），并保存有效的档案 ID。`
    )
  }
  return {
    adapter: createLlmAdapter(rowToLlmConfig(row)),
    config: rowToLlmConfig(row),
  }
}

export async function getEmbeddingAdapterForProject(
  projectId: string
): Promise<{
  adapter: ReturnType<typeof createEmbeddingAdapter>
  config: EmbeddingProfileConfig
}> {
  const s = await getProjectSettings(projectId)
  if (!s?.embeddingProfileId) {
    throw new Error("请先在项目设置中绑定 Embedding 配置。")
  }
  const row = await getEmbeddingRow(s.embeddingProfileId)
  if (!row) {
    throw new Error("Embedding 配置不存在。")
  }
  const config = rowToEmbeddingConfig(row)
  return { adapter: createEmbeddingAdapter(config), config }
}

/**
 * If step-specific profile is missing, fall back to any first LLM in DB.
 */
export async function getLlmAdapterWithFallback(
  projectId: string,
  step: GenStep
) {
  try {
    return await getLlmAdapterForProject(projectId, step)
  } catch {
    const first = await prisma.llmProfile.findFirst({
      orderBy: { createdAt: "asc" },
    })
    if (!first) {
      throw new Error("未找到任何 LLM 档案。请在「设置」中创建。")
    }
    return {
      adapter: createLlmAdapter(rowToLlmConfig(first)),
      config: rowToLlmConfig(first),
    }
  }
}
