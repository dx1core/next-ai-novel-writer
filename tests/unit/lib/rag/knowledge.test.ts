import { describe, expect, it, vi } from "vitest"

const { addDocumentChunksToVectorStore } = vi.hoisted(() => ({
  addDocumentChunksToVectorStore: vi.fn(),
}))

vi.mock("@/lib/rag/vectorstore", () => ({
  addDocumentChunksToVectorStore,
}))

import {
  importKnowledgeText,
  splitKnowledgeParagraphs,
} from "@/lib/rag/knowledge"

describe("knowledge helpers", () => {
  it("returns empty array for blank content", () => {
    expect(splitKnowledgeParagraphs("   ")).toEqual([])
  })

  it("splits paragraphs by sentences and length", () => {
    const text = "第一句。第二句。第三句。"
    expect(splitKnowledgeParagraphs(text, 5)).toEqual([
      "第一句。",
      "第二句。",
      "第三句。",
    ])
  })

  it("imports knowledge text with the knowledge source", async () => {
    const embedding = {
      embedDocuments: vi.fn(),
      embedQuery: vi.fn(),
    }

    await importKnowledgeText(embedding, "project-1", "第一句。第二句。")

    expect(addDocumentChunksToVectorStore).toHaveBeenCalledWith(
      embedding,
      "project-1",
      "knowledge",
      ["第一句。 第二句。"]
    )
  })
})
