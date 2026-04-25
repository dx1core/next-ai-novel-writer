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

/** Remove profile, clear project bindings; VectorEntry rows get embeddingProfileId null via FK. */
export async function deleteEmbeddingProfileAndClearAssignments(
  profileId: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.projectSettings.updateMany({
      where: { embeddingProfileId: profileId },
      data: { embeddingProfileId: null },
    })
    await tx.embeddingProfile.delete({ where: { id: profileId } })
  })
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

/** Remove profile and clear it from every project's model assignments. */
export async function deleteLlmProfileAndClearAssignments(profileId: string) {
  await prisma.$transaction(async (tx) => {
    const rows = await tx.projectSettings.findMany({
      where: {
        OR: [
          { architectureLlmId: profileId },
          { blueprintLlmId: profileId },
          { draftLlmId: profileId },
          { finalizeLlmId: profileId },
          { consistencyLlmId: profileId },
        ],
      },
    })
    for (const s of rows) {
      await tx.projectSettings.update({
        where: { id: s.id },
        data: {
          architectureLlmId:
            s.architectureLlmId === profileId ? null : s.architectureLlmId,
          blueprintLlmId:
            s.blueprintLlmId === profileId ? null : s.blueprintLlmId,
          draftLlmId: s.draftLlmId === profileId ? null : s.draftLlmId,
          finalizeLlmId: s.finalizeLlmId === profileId ? null : s.finalizeLlmId,
          consistencyLlmId:
            s.consistencyLlmId === profileId ? null : s.consistencyLlmId,
        },
      })
    }
    await tx.llmProfile.delete({ where: { id: profileId } })
  })
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
