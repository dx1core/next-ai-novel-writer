import { describe, expect, it, vi } from "vitest"

const {
  getProjectSettings,
  countVectorEntriesForProject,
  deleteVectorEntriesForProject,
  findNearestVectorEntries,
  insertVectorEntries,
} = vi.hoisted(() => ({
  getProjectSettings: vi.fn(),
  countVectorEntriesForProject: vi.fn(),
  deleteVectorEntriesForProject: vi.fn(),
  findNearestVectorEntries: vi.fn(),
  insertVectorEntries: vi.fn(),
}))

vi.mock("@/lib/db/profiles", () => ({
  getProjectSettings,
}))

vi.mock("@/lib/db/vector-entries", async () => {
  return {
    countVectorEntriesForProject,
    deleteVectorEntriesForProject,
    findNearestVectorEntries,
    insertVectorEntries,
  }
})

import {
  addDocumentChunksToVectorStore,
  getRelevantContextFromVectorStore,
  splitByLength,
  splitTextForVectorStore,
} from "@/lib/rag/vectorstore"

function makeEmbeddingVector(length = 1536) {
  return Array.from({ length }, () => 0.1)
}

describe("vectorstore helpers", () => {
  it("returns empty segments for blank text", () => {
    expect(splitTextForVectorStore("   ")).toEqual([])
  })

  it("splits by punctuation and newlines", () => {
    expect(splitTextForVectorStore("第一句。\n第二句！ Third?", 20)).toEqual([
      "第一句。 第二句！ Third?",
    ])
  })

  it("splits long text into multiple segments", () => {
    const text = "第一句。第二句。第三句。第四句。"
    expect(splitTextForVectorStore(text, 6)).toEqual([
      "第一句。",
      "第二句。",
      "第三句。",
      "第四句。",
    ])
  })

  it("splits by a fixed maximum length", () => {
    expect(splitByLength("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"])
  })

  it("returns empty context when no embedding profile is configured", async () => {
    getProjectSettings.mockResolvedValueOnce(null)
    const embedding = { embedDocuments: vi.fn(), embedQuery: vi.fn() }

    await expect(
      getRelevantContextFromVectorStore(embedding, "project-1", "query", 5)
    ).resolves.toBe("")
  })

  it("returns empty context when no vectors exist", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: "emb-1" })
    countVectorEntriesForProject.mockResolvedValueOnce(0)
    const embedding = { embedDocuments: vi.fn(), embedQuery: vi.fn() }

    await expect(
      getRelevantContextFromVectorStore(embedding, "project-1", "query", 5)
    ).resolves.toBe("")
  })

  it("returns empty context when query embedding is empty", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: "emb-1" })
    countVectorEntriesForProject.mockResolvedValueOnce(2)
    const embedding = {
      embedDocuments: vi.fn(),
      embedQuery: vi.fn().mockResolvedValueOnce([]),
    }

    await expect(
      getRelevantContextFromVectorStore(embedding, "project-1", "query", 5)
    ).resolves.toBe("")
  })

  it("limits k to stored vectors and truncates combined text to 2000 chars", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: "emb-1" })
    countVectorEntriesForProject.mockResolvedValueOnce(2)
    findNearestVectorEntries.mockResolvedValueOnce([
      "a".repeat(1500),
      "b".repeat(1500),
    ])
    const embedding = {
      embedDocuments: vi.fn(),
      embedQuery: vi.fn().mockResolvedValueOnce(makeEmbeddingVector()),
    }

    const result = await getRelevantContextFromVectorStore(
      embedding,
      "project-1",
      "query",
      10
    )

    expect(countVectorEntriesForProject).toHaveBeenCalledWith(
      "project-1",
      "emb-1"
    )
    expect(findNearestVectorEntries).toHaveBeenCalledWith(
      "project-1",
      "emb-1",
      makeEmbeddingVector(),
      2
    )
    expect(result).toHaveLength(2000)
  })

  it("returns empty context when retrieval throws", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: "emb-1" })
    countVectorEntriesForProject.mockRejectedValueOnce(new Error("db down"))
    const embedding = { embedDocuments: vi.fn(), embedQuery: vi.fn() }

    await expect(
      getRelevantContextFromVectorStore(embedding, "project-1", "query", 2)
    ).resolves.toBe("")
  })

  it("adds document chunks only when embedding results match the input size", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: "emb-1" })
    const embedding = {
      embedDocuments: vi
        .fn()
        .mockResolvedValueOnce([makeEmbeddingVector(), makeEmbeddingVector()]),
      embedQuery: vi.fn(),
    }

    await addDocumentChunksToVectorStore(embedding, "project-1", "chapter", [
      "片段一",
      "片段二",
    ])

    expect(insertVectorEntries).toHaveBeenCalledTimes(1)
    expect(insertVectorEntries).toHaveBeenCalledWith([
      {
        projectId: "project-1",
        embeddingProfileId: "emb-1",
        source: "chapter",
        content: "片段一",
        embedding: makeEmbeddingVector(),
      },
      {
        projectId: "project-1",
        embeddingProfileId: "emb-1",
        source: "chapter",
        content: "片段二",
        embedding: makeEmbeddingVector(),
      },
    ])
  })

  it("skips insertion when embedding results do not match the input size", async () => {
    getProjectSettings.mockResolvedValueOnce({ embeddingProfileId: "emb-1" })
    const embedding = {
      embedDocuments: vi.fn().mockResolvedValueOnce([makeEmbeddingVector()]),
      embedQuery: vi.fn(),
    }

    await addDocumentChunksToVectorStore(embedding, "project-1", "chapter", [
      "片段一",
      "片段二",
    ])

    expect(insertVectorEntries).not.toHaveBeenCalled()
  })
})
