import { randomBytes } from "node:crypto"
import { ChromaClient } from "chromadb"
import type { EmbeddingAdapter } from "@/lib/ai/embedding"

function chromaClient() {
  return new ChromaClient({
    host: process.env.CHROMA_HOST ?? "localhost",
    port: Number(process.env.CHROMA_PORT ?? 8000),
  })
}

function collectionName(projectId: string) {
  return `novel_${projectId}`.replace(/[^a-zA-Z0-9_-]/g, "_")
}

/**
 * Split like Python `split_text_for_vectorstore` (nltk sentences + max length 500).
 */
export function splitTextForVectorStore(
  chapterText: string,
  maxLength = 500
): string[] {
  if (!chapterText.trim()) {
    return []
  }
  const raw = chapterText
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const sentences = raw.length > 0 ? raw : [chapterText]
  const segments: string[] = []
  let current: string[] = []
  let len = 0
  for (const s of sentences) {
    if (len + s.length > maxLength && current.length) {
      segments.push(current.join(" "))
      current = [s]
      len = s.length
    } else {
      current.push(s)
      len += s.length
    }
  }
  if (current.length) {
    segments.push(current.join(" "))
  }
  return segments.map((s) => s.trim()).filter(Boolean)
}

function splitByLength(text: string, maxLength: number) {
  const segs: string[] = []
  let i = 0
  while (i < text.length) {
    segs.push(text.slice(i, i + maxLength).trim())
    i += maxLength
  }
  return segs.filter(Boolean)
}

export async function getOrCreateProjectCollection(
  projectId: string
): ReturnType<ChromaClient["getOrCreateCollection"]> {
  const client = chromaClient()
  return client.getOrCreateCollection({
    name: collectionName(projectId),
    metadata: { projectId },
  })
}

export async function clearVectorStoreForProject(projectId: string) {
  try {
    const client = chromaClient()
    await client.deleteCollection({ name: collectionName(projectId) })
  } catch {
    /* ignore if missing */
  }
}

export async function addChapterSegmentsToVectorStore(
  embedding: EmbeddingAdapter,
  projectId: string,
  chapterText: string
) {
  const segs = splitTextForVectorStore(chapterText)
  if (segs.length === 0) {
    return
  }
  const vecs = await callWithRetryEmb(() => embedding.embedDocuments(segs), [])
  if (vecs.length !== segs.length) {
    return
  }
  const coll = await getOrCreateProjectCollection(projectId)
  const ids = segs.map(() => `c_${randomBytes(8).toString("hex")}`)
  const metadatas = segs.map(() => ({ source: "chapter" as const }))
  await coll.add({ ids, embeddings: vecs, documents: segs, metadatas })
}

async function callWithRetryEmb<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn()
    } catch {
      if (i === 2) {
        return fallback
      }
    }
  }
  return fallback
}

/**
 * @returns up to 2000 chars
 */
export async function getRelevantContextFromVectorStore(
  embedding: EmbeddingAdapter,
  projectId: string,
  query: string,
  k: number
) {
  try {
    const coll = await getOrCreateProjectCollection(projectId)
    const c = await coll.count()
    const actualK = Math.min(k, Math.max(1, c))
    if (c === 0) {
      return ""
    }
    const qe = await embedding.embedQuery(query)
    if (qe.length === 0) {
      return ""
    }
    const res = await coll.query({
      queryEmbeddings: [qe],
      nResults: actualK,
    })
    const docs = res.documents?.[0] ?? []
    const combined = docs.filter(Boolean).join("\n")
    return combined.length > 2000 ? combined.slice(0, 2000) : combined
  } catch {
    return ""
  }
}

export { splitByLength }
