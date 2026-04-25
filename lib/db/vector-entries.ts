import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/db"

/** Fixed dimension for pgvector column `vector(1536)`. */
export const EMBEDDING_DIMENSION = 1536

export type VectorEntrySource = "chapter" | "knowledge"

export type VectorEntryInsert = {
  projectId: string
  embeddingProfileId: string | null
  source: VectorEntrySource
  content: string
  embedding: number[]
}

function assertValidEmbedding(embedding: number[]): void {
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding length must be ${EMBEDDING_DIMENSION}, got ${embedding.length}`
    )
  }
  for (let i = 0; i < embedding.length; i++) {
    if (!Number.isFinite(embedding[i])) {
      throw new Error(`Embedding contains non-finite value at index ${i}`)
    }
  }
}

/** PostgreSQL / pgvector literal: `[a,b,c]` */
export function embeddingToVectorLiteral(embedding: number[]): string {
  assertValidEmbedding(embedding)
  return `[${embedding.join(",")}]`
}

function newVectorEntryId(): string {
  return randomBytes(16).toString("hex")
}

/**
 * Batch insert RAG chunks. Uses parameterized SQL; vector passed as text cast to `vector`.
 */
export async function insertVectorEntries(entries: VectorEntryInsert[]) {
  if (entries.length === 0) {
    return
  }
  await prisma.$transaction(async (tx) => {
    for (const e of entries) {
      assertValidEmbedding(e.embedding)
      const id = newVectorEntryId()
      const vec = embeddingToVectorLiteral(e.embedding)
      await tx.$executeRaw`
        INSERT INTO "VectorEntry" (
          "id",
          "projectId",
          "embeddingProfileId",
          "source",
          "content",
          "embedding",
          "createdAt"
        )
        VALUES (
          ${id},
          ${e.projectId},
          ${e.embeddingProfileId},
          ${e.source},
          ${e.content},
          ${vec}::vector,
          CURRENT_TIMESTAMP
        )
      `
    }
  })
}

export async function deleteVectorEntriesForProject(projectId: string) {
  await prisma.$executeRaw`
    DELETE FROM "VectorEntry" WHERE "projectId" = ${projectId}
  `
}

/**
 * Count vectors for retrieval scope: same project and embedding profile.
 */
export async function countVectorEntriesForProject(
  projectId: string,
  embeddingProfileId: string | null
): Promise<number> {
  if (!embeddingProfileId) {
    return 0
  }
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint AS count
    FROM "VectorEntry"
    WHERE "projectId" = ${projectId}
      AND "embeddingProfileId" = ${embeddingProfileId}
  `
  const n = rows[0]?.count
  return n === undefined ? 0 : Number(n)
}

/**
 * Nearest neighbors by cosine distance (`<=>` with `vector_cosine_ops` index).
 */
export async function findNearestVectorEntries(
  projectId: string,
  embeddingProfileId: string | null,
  queryEmbedding: number[],
  limit: number
): Promise<string[]> {
  if (!embeddingProfileId || limit <= 0) {
    return []
  }
  assertValidEmbedding(queryEmbedding)
  const vec = embeddingToVectorLiteral(queryEmbedding)
  const rows = await prisma.$queryRaw<{ content: string }[]>`
    SELECT "content"
    FROM "VectorEntry"
    WHERE "projectId" = ${projectId}
      AND "embeddingProfileId" = ${embeddingProfileId}
    ORDER BY "embedding" <=> ${vec}::vector
    LIMIT ${limit}
  `
  return rows.map((r) => r.content)
}
