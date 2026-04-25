import { GoogleGenerativeAI } from "@google/generative-ai"
import { AzureOpenAI, OpenAI } from "openai"
import type { LlmProfileConfig } from "@/lib/types"
import { checkBaseUrl } from "./base-url"

export type LlmAdapter = {
  invoke: (prompt: string) => Promise<string>
  /** 用于日志的调用地址（不含密钥、不含 prompt） */
  requestUrl?: string
}

function openAiLikeClient(config: LlmProfileConfig) {
  const key = config.apiKey || (config.modelName ? "ollama" : "")
  return new OpenAI({
    apiKey: key,
    baseURL: checkBaseUrl(config.baseUrl),
    maxRetries: 0,
    timeout: (config.timeout ?? 600) * 1000,
  })
}

function chatCompletionContent(
  client: OpenAI,
  model: string,
  prompt: string,
  maxTokens: number,
  temperature: number
) {
  return client.chat.completions
    .create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    })
    .then((r) => r.choices[0]?.message?.content ?? "")
}

function createOpenAiLikeAdapter(config: LlmProfileConfig): LlmAdapter {
  const client = openAiLikeClient(config)
  const base = checkBaseUrl(config.baseUrl).replace(/\/$/, "")
  return {
    requestUrl: `${base}/chat/completions`,
    async invoke(prompt: string) {
      const content = await chatCompletionContent(
        client,
        config.modelName,
        prompt,
        config.maxTokens,
        config.temperature
      )
      if (!content) {
        return ""
      }
      return content
    },
  }
}

function createAzureOpenAiAdapter(config: LlmProfileConfig): LlmAdapter {
  const m =
    /https:\/\/(.+?)\/openai\/deployments\/(.+?)\/chat\/completions\?api-version=(.+)/.exec(
      config.baseUrl.trim()
    )
  if (!m) {
    throw new Error("Invalid Azure OpenAI base_url format")
  }
  const endpoint = `https://${m[1]}`
  const apiVersion = m[3]
  const client = new AzureOpenAI({
    apiKey: config.apiKey,
    endpoint,
    apiVersion,
    deployment: m[2],
  })
  return {
    requestUrl: config.baseUrl.trim(),
    async invoke(prompt: string) {
      const r = await client.chat.completions.create({
        model: m[2],
        messages: [{ role: "user", content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      })
      return r.choices[0]?.message?.content ?? ""
    },
  }
}

function createGeminiAdapter(config: LlmProfileConfig): LlmAdapter {
  const genAI = new GoogleGenerativeAI(config.apiKey)
  const model = genAI.getGenerativeModel({ model: config.modelName })
  const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent`
  return {
    requestUrl,
    async invoke(prompt: string) {
      const result = await model.generateContent(prompt)
      return result.response.text() ?? ""
    },
  }
}

/**
 * Azure AI Inference (e.g. *.services.ai.azure.com). POST JSON chat completions.
 */
function createAzureAiInferenceAdapter(config: LlmProfileConfig): LlmAdapter {
  const u = config.baseUrl.trim()
  return {
    requestUrl: u,
    async invoke(prompt: string) {
      const res = await fetch(u, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": config.apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        }),
        signal: AbortSignal.timeout((config.timeout ?? 600) * 1000),
      })
      if (!res.ok) {
        const bodyPreview = await res
          .text()
          .then((t) => t.slice(0, 800))
          .catch(() => "")
        console.error("[LLM] Azure AI Inference request failed", {
          url: u,
          status: res.status,
          statusText: res.statusText,
          bodyPreview: bodyPreview || undefined,
        })
        return ""
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      return data.choices?.[0]?.message?.content ?? ""
    },
  }
}

export function createLlmAdapter(config: LlmProfileConfig): LlmAdapter {
  const fmt = config.interfaceFormat.trim().toLowerCase()
  if (fmt === "gemini") {
    return createGeminiAdapter(config)
  }
  if (fmt === "azure openai") {
    return createAzureOpenAiAdapter(config)
  }
  if (fmt === "azure ai") {
    return createAzureAiInferenceAdapter(config)
  }
  return createOpenAiLikeAdapter(config)
}
