import { prisma } from "@/lib/db"
import type { EmbeddingProfileConfig, LlmProfileConfig } from "@/lib/types"

function toLlmConfig(row: {
  name: string
  interfaceFormat: string
  apiKey: string
  baseUrl: string
  modelName: string
  temperature: number
  maxTokens: number
  timeout: number
}): LlmProfileConfig {
  return {
    name: row.name,
    interfaceFormat: row.interfaceFormat,
    apiKey: row.apiKey,
    baseUrl: row.baseUrl,
    modelName: row.modelName,
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    timeout: row.timeout,
  }
}

function toEmbConfig(row: {
  name: string
  interfaceFormat: string
  apiKey: string
  baseUrl: string
  modelName: string
  retrievalK: number
}): EmbeddingProfileConfig {
  return {
    name: row.name,
    interfaceFormat: row.interfaceFormat,
    apiKey: row.apiKey,
    baseUrl: row.baseUrl,
    modelName: row.modelName,
    retrievalK: row.retrievalK,
  }
}

export async function listLlmProfiles() {
  return prisma.llmProfile.findMany({ orderBy: { name: "asc" } })
}

export async function getLlmProfile(id: string) {
  const r = await prisma.llmProfile.findUnique({ where: { id } })
  return r ? toLlmConfig(r) : null
}

export async function getLlmRow(id: string | null | undefined) {
  if (!id) {
    return null
  }
  return prisma.llmProfile.findUnique({ where: { id } })
}

export function rowToLlmConfig(
  row: NonNullable<Awaited<ReturnType<typeof getLlmRow>>>
) {
  return toLlmConfig(row)
}

export async function listEmbeddingProfiles() {
  return prisma.embeddingProfile.findMany({ orderBy: { name: "asc" } })
}

export async function getEmbeddingRow(id: string | null | undefined) {
  if (!id) {
    return null
  }
  return prisma.embeddingProfile.findUnique({ where: { id } })
}

export function rowToEmbeddingConfig(
  row: NonNullable<Awaited<ReturnType<typeof getEmbeddingRow>>>
) {
  return toEmbConfig(row)
}

export async function createLlmProfile(data: {
  name: string
  interfaceFormat: string
  apiKey: string
  baseUrl: string
  modelName: string
  temperature: number
  maxTokens: number
  timeout: number
}) {
  return prisma.llmProfile.create({ data })
}

export async function createEmbeddingProfile(data: {
  name: string
  interfaceFormat: string
  apiKey: string
  baseUrl: string
  modelName: string
  retrievalK: number
}) {
  return prisma.embeddingProfile.create({ data })
}

export async function updateLlmProfile(
  id: string,
  data: Partial<{
    name: string
    interfaceFormat: string
    apiKey: string
    baseUrl: string
    modelName: string
    temperature: number
    maxTokens: number
    timeout: number
  }>
) {
  return prisma.llmProfile.update({ where: { id }, data })
}

export async function updateEmbeddingProfile(
  id: string,
  data: Partial<{
    name: string
    interfaceFormat: string
    apiKey: string
    baseUrl: string
    modelName: string
    retrievalK: number
  }>
) {
  return prisma.embeddingProfile.update({ where: { id }, data })
}

export async function getProjectSettings(projectId: string) {
  return prisma.projectSettings.findUnique({ where: { projectId } })
}

export async function updateProjectSettings(
  projectId: string,
  data: Partial<{
    architectureLlmId: string | null
    blueprintLlmId: string | null
    draftLlmId: string | null
    finalizeLlmId: string | null
    consistencyLlmId: string | null
    embeddingProfileId: string | null
    proxyEnabled: boolean
    proxyUrl: string
    proxyPort: string
  }>
) {
  return prisma.projectSettings.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  })
}
