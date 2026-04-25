"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import {
  createEmbeddingProfile,
  createLlmProfile,
  deleteEmbeddingProfileAndClearAssignments,
  deleteLlmProfileAndClearAssignments,
  listEmbeddingProfiles,
  listLlmProfiles,
  updateEmbeddingProfile,
  updateLlmProfile,
  updateProjectSettings,
} from "@/lib/db/profiles"
import { clearVectorStoreForProject } from "@/lib/rag/vectorstore"

export async function listLlmProfilesAction() {
  return listLlmProfiles()
}

export async function listEmbeddingProfilesAction() {
  return listEmbeddingProfiles()
}

export async function createLlmProfileAction(
  data: Parameters<typeof createLlmProfile>[0]
) {
  const p = await createLlmProfile(data)
  revalidatePath("/")
  return p
}

export async function createEmbeddingProfileAction(
  data: Parameters<typeof createEmbeddingProfile>[0]
) {
  const p = await createEmbeddingProfile(data)
  revalidatePath("/")
  return p
}

export async function updateLlmProfileAction(
  id: string,
  data: Parameters<typeof updateLlmProfile>[1]
) {
  const row = await updateLlmProfile(id, data)
  revalidatePath("/")
  return row
}

export async function deleteLlmProfileAction(
  profileId: string,
  currentProjectId: string
) {
  await deleteLlmProfileAndClearAssignments(profileId)
  revalidatePath("/")
  revalidatePath(`/${currentProjectId}/settings`)
}

export async function updateEmbeddingProfileAction(
  id: string,
  data: Parameters<typeof updateEmbeddingProfile>[1]
) {
  const row = await updateEmbeddingProfile(id, data)
  revalidatePath("/")
  return row
}

export async function deleteEmbeddingProfileAction(
  profileId: string,
  currentProjectId: string
) {
  await deleteEmbeddingProfileAndClearAssignments(profileId)
  revalidatePath("/")
  revalidatePath(`/${currentProjectId}/settings`)
}

export async function updateProjectModelAssignmentsAction(
  projectId: string,
  data: {
    architectureLlmId?: string | null
    blueprintLlmId?: string | null
    draftLlmId?: string | null
    finalizeLlmId?: string | null
    consistencyLlmId?: string | null
    embeddingProfileId?: string | null
    proxyEnabled?: boolean
    proxyUrl?: string
    proxyPort?: string
  }
) {
  await updateProjectSettings(projectId, data)
  revalidatePath(`/${projectId}/settings`)
}

export async function clearVectorStoreAction(projectId: string) {
  await clearVectorStoreForProject(projectId)
  return { ok: true as const }
}

export async function updateArchitectureTextAction(
  projectId: string,
  content: string
) {
  await prisma.novelArchitecture.upsert({
    where: { projectId },
    create: { projectId, content },
    update: { content },
  })
  revalidatePath(`/${projectId}/architecture`)
}

export async function updateBlueprintTextAction(
  projectId: string,
  content: string
) {
  await prisma.chapterBlueprint.upsert({
    where: { projectId },
    create: { projectId, content },
    update: { content },
  })
  revalidatePath(`/${projectId}/blueprint`)
}

export async function updateStateTextsAction(
  projectId: string,
  which: "summary" | "character" | "plot",
  content: string
) {
  if (which === "summary") {
    await prisma.globalSummary.upsert({
      where: { projectId },
      create: { projectId, content },
      update: { content },
    })
    revalidatePath(`/${projectId}/summary`)
  } else if (which === "character") {
    await prisma.characterState.upsert({
      where: { projectId },
      create: { projectId, content },
      update: { content },
    })
    revalidatePath(`/${projectId}/characters`)
  } else {
    await prisma.plotArcs.upsert({
      where: { projectId },
      create: { projectId, content },
      update: { content },
    })
    revalidatePath(`/${projectId}/plot-arcs`)
  }
}

export async function updateChapterTextAction(
  projectId: string,
  number: number,
  draftContent: string
) {
  await prisma.chapter.upsert({
    where: { projectId_number: { projectId, number } },
    create: { projectId, number, draftContent },
    update: { draftContent },
  })
  revalidatePath(`/${projectId}/chapters/${number}`)
}
