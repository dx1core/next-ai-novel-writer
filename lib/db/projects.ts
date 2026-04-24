import { prisma } from "@/lib/db"

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      topic: true,
      genre: true,
      numChapters: true,
      wordNumber: true,
      currentChapter: true,
      updatedAt: true,
    },
  })
}

export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      settings: true,
      architecture: true,
      blueprint: true,
      globalSummary: true,
      characterState: true,
      plotArcs: true,
    },
  })
}

export async function createProject(data: {
  name: string
  topic?: string
  genre?: string
}) {
  return prisma.project.create({
    data: {
      name: data.name,
      topic: data.topic ?? "",
      genre: data.genre ?? "玄幻",
      settings: { create: {} },
      globalSummary: { create: { content: "" } },
      characterState: { create: { content: "" } },
      plotArcs: { create: { content: "" } },
    },
  })
}

export async function updateProjectMeta(
  projectId: string,
  data: {
    name?: string
    topic?: string
    genre?: string
    numChapters?: number
    wordNumber?: number
    currentChapter?: number
    userGuidance?: string
  }
) {
  return prisma.project.update({ where: { id: projectId }, data })
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({ where: { id: projectId } })
}
