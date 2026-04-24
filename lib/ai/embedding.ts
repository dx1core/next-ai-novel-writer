import OpenAI from "openai"
import type { EmbeddingProfileConfig } from "@/lib/types"
import { ensureOpenAiEmbeddingBaseUrl } from "./base-url"

export type EmbeddingAdapter = {
  embedDocuments: (texts: string[]) => Promise<number[][]>
  embedQuery: (query: string) => Promise<number[]>
}

async function postJson<T>(
  url: string,
  body: unknown,
  headers: Record<string, string>
) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    return null
  }
  return (await res.json()) as T
}

function createOpenAiEmbeddings(
  config: EmbeddingProfileConfig
): EmbeddingAdapter {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: ensureOpenAiEmbeddingBaseUrl(config.baseUrl),
  })
  return {
    async embedDocuments(texts: string[]) {
      if (texts.length === 0) {
        return []
      }
      const r = await client.embeddings.create({
        model: config.modelName,
        input: texts,
      })
      return r.data.map((d) => d.embedding)
    },
    async embedQuery(query: string) {
      const r = await client.embeddings.create({
        model: config.modelName,
        input: query,
      })
      return r.data[0]?.embedding ?? []
    },
  }
}

function ollamaEmbeddingsUrl(baseUrl: string): string {
  let url = baseUrl.replace(/\/+$/, "")
  if (url.includes("/api/embeddings")) {
    return url
  }
  if (url.includes("/api")) {
    return `${url}/embeddings`
  }
  if (url.includes("/v1")) {
    url = url.slice(0, url.indexOf("/v1"))
  }
  return `${url}/api/embeddings`
}

function createOllamaEmbeddings(
  config: EmbeddingProfileConfig
): EmbeddingAdapter {
  const url = ollamaEmbeddingsUrl(config.baseUrl)
  return {
    async embedDocuments(texts: string[]) {
      const out: number[][] = []
      for (const t of texts) {
        const j = await postJson<{ embedding?: number[] }>(
          url,
          { model: config.modelName, prompt: t },
          {
            "Content-Type": "application/json",
          }
        )
        out.push(j?.embedding ?? [])
      }
      return out
    },
    async embedQuery(query: string) {
      const j = await postJson<{ embedding?: number[] }>(
        url,
        { model: config.modelName, prompt: query },
        {
          "Content-Type": "application/json",
        }
      )
      return j?.embedding ?? []
    },
  }
}

function createMlStudioEmbeddings(
  config: EmbeddingProfileConfig
): EmbeddingAdapter {
  let url = ensureOpenAiEmbeddingBaseUrl(config.baseUrl)
  if (!url.endsWith("/embeddings")) {
    url = `${url}/embeddings`
  }
  return {
    async embedDocuments(texts: string[]) {
      const j = await postJson<{ data?: { embedding: number[] }[] }>(
        url,
        { input: texts, model: config.modelName },
        {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        }
      )
      if (!j?.data) {
        return texts.map(() => [])
      }
      return j.data.map((d) => d.embedding ?? [])
    },
    async embedQuery(query: string) {
      const j = await postJson<{ data?: { embedding: number[] }[] }>(
        url,
        { input: query, model: config.modelName },
        {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        }
      )
      return j?.data?.[0]?.embedding ?? []
    },
  }
}

/** Gemini embed via REST */
function createGeminiEmbeddings(
  config: EmbeddingProfileConfig
): EmbeddingAdapter {
  const base = config.baseUrl.replace(/\/+$/, "")
  const apiKey = config.apiKey
  async function embedOne(text: string) {
    const u = `${base}/${encodeURIComponent(config.modelName)}:embedContent?key=${encodeURIComponent(apiKey)}`
    const j = await postJson<{ embedding?: { values?: number[] } }>(
      u,
      { content: { parts: [{ text }], role: "user" } },
      { "Content-Type": "application/json" }
    )
    return j?.embedding?.values ?? []
  }
  return {
    async embedDocuments(texts: string[]) {
      const r: number[][] = []
      for (const t of texts) {
        r.push(await embedOne(t))
      }
      return r
    },
    embedQuery: (query) => embedOne(query),
  }
}

function createSiliconflowEmbeddings(
  config: EmbeddingProfileConfig
): EmbeddingAdapter {
  let base = config.baseUrl.trim()
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`
  }
  const url = base.includes("embeddings")
    ? base
    : `${base.replace(/\/+$/, "")}/v1/embeddings`
  return {
    async embedDocuments(texts: string[]) {
      const r: number[][] = []
      for (const t of texts) {
        const j = await postJson<{ data?: { embedding: number[] }[] }>(
          url,
          { model: config.modelName, input: t, encoding_format: "float" },
          {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          }
        )
        r.push(j?.data?.[0]?.embedding ?? [])
      }
      return r
    },
    async embedQuery(query: string) {
      const j = await postJson<{ data?: { embedding: number[] }[] }>(
        url,
        { model: config.modelName, input: query, encoding_format: "float" },
        {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        }
      )
      return j?.data?.[0]?.embedding ?? []
    },
  }
}

/**
 * @param config — maps from EmbeddingProfile / UI
 */
export function createEmbeddingAdapter(
  config: EmbeddingProfileConfig
): EmbeddingAdapter {
  const fmt = config.interfaceFormat.trim().toLowerCase()
  if (fmt === "openai" || fmt === "阿里云百炼" || fmt === "火山引擎") {
    return createOpenAiEmbeddings(config)
  }
  if (fmt === "ollama") {
    return createOllamaEmbeddings(config)
  }
  if (fmt === "ml studio") {
    return createMlStudioEmbeddings(config)
  }
  if (fmt === "gemini") {
    return createGeminiEmbeddings(config)
  }
  if (fmt === "siliconflow" || fmt === "硅基流动") {
    return createSiliconflowEmbeddings(config)
  }
  if (fmt === "azure openai") {
    return createOpenAiEmbeddings({
      ...config,
      baseUrl: config.baseUrl,
    })
  }
  return createOpenAiEmbeddings(config)
}
