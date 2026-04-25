import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {},
}))

import {
  EMBEDDING_DIMENSION,
  embeddingToVectorLiteral,
} from "@/lib/db/vector-entries"

function makeEmbedding() {
  return Array.from({ length: EMBEDDING_DIMENSION }, (_, index) => index / 10)
}

describe("embeddingToVectorLiteral", () => {
  it("converts embedding arrays to pgvector literals", () => {
    const literal = embeddingToVectorLiteral(makeEmbedding())

    expect(literal.startsWith("[0,0.1,0.2")).toBe(true)
    expect(literal.endsWith("]")).toBe(true)
  })

  it("throws when the embedding dimension is invalid", () => {
    expect(() => embeddingToVectorLiteral([1, 2, 3])).toThrow(
      `Embedding length must be ${EMBEDDING_DIMENSION}`
    )
  })

  it("throws when any value is non-finite", () => {
    const embedding = makeEmbedding()
    embedding[10] = Number.NaN

    expect(() => embeddingToVectorLiteral(embedding)).toThrow(
      "Embedding contains non-finite value at index 10"
    )
  })
})
