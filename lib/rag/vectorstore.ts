import type { EmbeddingAdapter } from "@/lib/ai/embedding"
import { getProjectSettings } from "@/lib/db/profiles"
import {
  countVectorEntriesForProject,
  deleteVectorEntriesForProject,
  findNearestVectorEntries,
  insertVectorEntries,
  type VectorEntrySource,
} from "@/lib/db/vector-entries"

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
    .split(/(?<=[.!?。！？])\s*|\n+/)
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

export async function clearVectorStoreForProject(projectId: string) {
  try {
    await deleteVectorEntriesForProject(projectId)
  } catch {
    /* ignore if DB unavailable */
  }
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
 * Embed and persist text chunks for RAG (pgvector). Skips when project has no Embedding 档案.
 */
export async function addDocumentChunksToVectorStore(
  embedding: EmbeddingAdapter,
  projectId: string,
  source: VectorEntrySource,
  texts: string[]
) {
  if (texts.length === 0) {
    return
  }
  const settings = await getProjectSettings(projectId)
  const embeddingProfileId = settings?.embeddingProfileId ?? null
  if (!embeddingProfileId) {
    return
  }
  const vecs = await callWithRetryEmb(() => embedding.embedDocuments(texts), [])
  if (vecs.length !== texts.length) {
    return
  }
  const entries = texts.map((content, i) => ({
    projectId,
    embeddingProfileId,
    source,
    content,
    embedding: vecs[i] ?? [],
  }))
  await insertVectorEntries(entries)
}

export async function addChapterSegmentsToVectorStore(
  embedding: EmbeddingAdapter,
  projectId: string,
  chapterText: string
) {
  const segs = splitTextForVectorStore(chapterText)
  await addDocumentChunksToVectorStore(embedding, projectId, "chapter", segs)
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
    const settings = await getProjectSettings(projectId)
    const embeddingProfileId = settings?.embeddingProfileId ?? null
    if (!embeddingProfileId) {
      return ""
    }
    const c = await countVectorEntriesForProject(projectId, embeddingProfileId)
    const actualK = Math.min(k, Math.max(1, c))
    if (c === 0) {
      return ""
    }
    const qe = await embedding.embedQuery(query)
    if (qe.length === 0) {
      return ""
    }
    const docs = await findNearestVectorEntries(
      projectId,
      embeddingProfileId,
      qe,
      actualK
    )
    const combined = docs.filter(Boolean).join("\n")
    return combined.length > 2000 ? combined.slice(0, 2000) : combined
  } catch {
    return ""
  }
}

export { splitByLength }
