/**
 * OpenAI-style base_url: if ends with `#`, strip it; else ensure `/v1` suffix.
 */
export function checkBaseUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) {
    return trimmed
  }
  if (trimmed.endsWith("#")) {
    return trimmed.replace(/#+$/, "")
  }
  if (!/\/v\d+$/i.test(trimmed) && !trimmed.includes("/v1")) {
    return `${trimmed.replace(/\/+$/, "")}/v1`
  }
  return trimmed
}

export function ensureOpenAiEmbeddingBaseUrl(url: string): string {
  return checkBaseUrl(url)
}
