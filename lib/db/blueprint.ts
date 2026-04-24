import { prisma } from "@/lib/db"

export async function getBlueprint(projectId: string) {
  return prisma.chapterBlueprint.findUnique({ where: { projectId } })
}

export async function setBlueprintContent(projectId: string, content: string) {
  return prisma.chapterBlueprint.upsert({
    where: { projectId },
    create: { projectId, content },
    update: { content },
  })
}

export async function appendBlueprintContent(projectId: string, text: string) {
  const cur = await prisma.chapterBlueprint.findUnique({ where: { projectId } })
  const next = `${cur?.content ?? ""}\n\n${text}`.trim()
  return setBlueprintContent(projectId, next)
}
