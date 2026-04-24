import { prisma } from "@/lib/db"

export async function getGlobalSummary(projectId: string) {
  return prisma.globalSummary.findUnique({ where: { projectId } })
}

export async function setGlobalSummaryContent(
  projectId: string,
  content: string
) {
  return prisma.globalSummary.upsert({
    where: { projectId },
    create: { projectId, content },
    update: { content },
  })
}

export async function getCharacterState(projectId: string) {
  return prisma.characterState.findUnique({ where: { projectId } })
}

export async function setCharacterStateContent(
  projectId: string,
  content: string
) {
  return prisma.characterState.upsert({
    where: { projectId },
    create: { projectId, content },
    update: { content },
  })
}

export async function getPlotArcs(projectId: string) {
  return prisma.plotArcs.findUnique({ where: { projectId } })
}

export async function setPlotArcsContent(projectId: string, content: string) {
  return prisma.plotArcs.upsert({
    where: { projectId },
    create: { projectId, content },
    update: { content },
  })
}
