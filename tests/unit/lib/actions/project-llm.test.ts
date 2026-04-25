import { describe, expect, it, vi } from "vitest"

const {
  createEmbeddingAdapter,
  createLlmAdapter,
  getEmbeddingRow,
  getLlmRow,
  getProjectSettings,
  rowToEmbeddingConfig,
  rowToLlmConfig,
  prisma,
} = vi.hoisted(() => ({
  createEmbeddingAdapter: vi.fn(),
  createLlmAdapter: vi.fn(),
  getEmbeddingRow: vi.fn(),
  getLlmRow: vi.fn(),
  getProjectSettings: vi.fn(),
  rowToEmbeddingConfig: vi.fn(),
  rowToLlmConfig: vi.fn(),
  prisma: {
    llmProfile: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/ai/embedding", () => ({
  createEmbeddingAdapter,
}))

vi.mock("@/lib/ai/llm", () => ({
  createLlmAdapter,
}))

vi.mock("@/lib/db", () => ({
  prisma,
}))

vi.mock("@/lib/db/profiles", () => ({
  getEmbeddingRow,
  getLlmRow,
  getProjectSettings,
  rowToEmbeddingConfig,
  rowToLlmConfig,
}))

import {
  getEmbeddingAdapterForProject,
  getLlmAdapterForProject,
  getLlmAdapterWithFallback,
} from "@/lib/actions/project-llm"

describe("project llm helpers", () => {
  it("throws when the step profile is not configured", async () => {
    getProjectSettings.mockResolvedValueOnce({
      draftLlmId: null,
    })
    getLlmRow.mockResolvedValueOnce(null)

    await expect(getLlmAdapterForProject("project-1", "draft")).rejects.toThrow(
      "请先在项目设置中为此步骤选择 LLM 配置（draft）"
    )
  })

  it("throws when embedding profile is not bound", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: null })

    await expect(getEmbeddingAdapterForProject("project-1")).rejects.toThrow(
      "请先在项目设置中绑定 Embedding 配置。"
    )
  })

  it("throws when the bound embedding profile does not exist", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: "emb-1" })
    getEmbeddingRow.mockResolvedValueOnce(null)

    await expect(getEmbeddingAdapterForProject("project-1")).rejects.toThrow(
      "Embedding 配置不存在。"
    )
  })

  it("falls back to the first llm profile when the step profile is missing", async () => {
    const row = {
      name: "fallback",
      interfaceFormat: "openai",
      apiKey: "key",
      baseUrl: "https://example.com/v1",
      modelName: "gpt-test",
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 30,
    }
    const config = {
      name: "fallback",
      interfaceFormat: "openai",
      apiKey: "key",
      baseUrl: "https://example.com/v1",
      modelName: "gpt-test",
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 30,
    }
    const adapter = { invoke: vi.fn() }

    getProjectSettings.mockResolvedValueOnce({ draftLlmId: null })
    getLlmRow.mockResolvedValueOnce(null)
    prisma.llmProfile.findFirst.mockResolvedValueOnce(row)
    rowToLlmConfig.mockReturnValue(config)
    createLlmAdapter.mockReturnValue(adapter)

    await expect(
      getLlmAdapterWithFallback("project-1", "draft")
    ).resolves.toEqual({
      adapter,
      config,
    })
  })
})
