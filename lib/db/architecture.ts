import { prisma } from "@/lib/db"
import type { PartialArchitectureData } from "@/lib/types"

export async function getNovelArchitecture(projectId: string) {
  return prisma.novelArchitecture.findUnique({ where: { projectId } })
}

export async function saveArchitecturePartial(
  projectId: string,
  partial: PartialArchitectureData
) {
  return prisma.novelArchitecture.upsert({
    where: { projectId },
    create: { projectId, content: "", partialJson: JSON.stringify(partial) },
    update: { partialJson: JSON.stringify(partial) },
  })
}

export async function clearArchitecturePartial(projectId: string) {
  return prisma.novelArchitecture.update({
    where: { projectId },
    data: { partialJson: "" },
  })
}

export async function setArchitectureContent(
  projectId: string,
  content: string
) {
  return prisma.novelArchitecture.upsert({
    where: { projectId },
    create: { projectId, content, partialJson: "" },
    update: { content, partialJson: "" },
  })
}

export function parsePartialJson(raw: string): PartialArchitectureData {
  if (!raw.trim()) {
    return {}
  }
  try {
    return JSON.parse(raw) as PartialArchitectureData
  } catch {
    return {}
  }
}
