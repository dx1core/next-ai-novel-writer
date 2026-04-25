import type { EmbeddingAdapter } from "@/lib/ai/embedding"
import { addDocumentChunksToVectorStore } from "./vectorstore"

/**
 * Port of `advanced_split_content` in `knowledge.py` (nltk → sentence+length 500).
 */
export function splitKnowledgeParagraphs(
  content: string,
  maxLength = 500
): string[] {
  if (!content.trim()) {
    return []
  }
  return splitSentencesToParagraphs(
    content
      .split(/(?<=[.!?。！？])\s*|\n+/)
      .map((s) => s.trim())
      .filter(Boolean),
    maxLength
  )
}

function splitSentencesToParagraphs(
  sentences: string[],
  maxLength: number
): string[] {
  if (sentences.length === 0) {
    return []
  }
  const out: string[] = []
  let current: string[] = []
  let len = 0
  for (const s of sentences) {
    if (len + s.length > maxLength && current.length) {
      out.push(current.join(" "))
      current = [s]
      len = s.length
    } else {
      current.push(s)
      len += s.length
    }
  }
  if (current.length) {
    out.push(current.join(" "))
  }
  return out
}

export async function importKnowledgeText(
  embedding: EmbeddingAdapter,
  projectId: string,
  fileContent: string
) {
  const paras = splitKnowledgeParagraphs(fileContent)
  await addDocumentChunksToVectorStore(embedding, projectId, "knowledge", paras)
}
