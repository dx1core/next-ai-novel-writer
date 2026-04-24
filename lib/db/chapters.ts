import { ChapterStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/db"

export async function getChapter(projectId: string, number: number) {
  return prisma.chapter.findUnique({
    where: { projectId_number: { projectId, number } },
  })
}

export async function listChapters(projectId: string) {
  return prisma.chapter.findMany({
    where: { projectId },
    orderBy: { number: "asc" },
    select: { id: true, number: true, status: true, updatedAt: true },
  })
}

export async function getChapterTextForRag(
  projectId: string,
  beforeChapter: number,
  n: number
) {
  const start = Math.max(1, beforeChapter - n)
  const rows = await prisma.chapter.findMany({
    where: { projectId, number: { gte: start, lt: beforeChapter } },
    orderBy: { number: "asc" },
  })
  return rows
    .map((r) =>
      (r.status === "FINAL" && r.finalContent
        ? r.finalContent
        : r.draftContent
      ).trim()
    )
    .filter(Boolean)
}

export async function upsertChapterDraft(
  projectId: string,
  number: number,
  draftContent: string
) {
  return prisma.chapter.upsert({
    where: { projectId_number: { projectId, number } },
    create: { projectId, number, draftContent, status: ChapterStatus.DRAFT },
    update: { draftContent, status: ChapterStatus.DRAFT },
  })
}

export async function setChapterFinal(
  projectId: string,
  number: number,
  finalText: string
) {
  return prisma.chapter.upsert({
    where: { projectId_number: { projectId, number } },
    create: {
      projectId,
      number,
      finalContent: finalText,
      draftContent: finalText,
      status: ChapterStatus.FINAL,
    },
    update: {
      finalContent: finalText,
      draftContent: finalText,
      status: ChapterStatus.FINAL,
    },
  })
}

export async function getMaxChapterNumberWithFile(projectId: string) {
  const row = await prisma.chapter.aggregate({
    where: { projectId },
    _max: { number: true },
  })
  return row._max.number ?? 0
}
