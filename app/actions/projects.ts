"use server"

import { revalidatePath } from "next/cache"
import {
  createProject,
  deleteProject,
  listProjects,
  updateProjectMeta,
} from "@/lib/db/projects"

export async function listProjectsAction() {
  return listProjects()
}

export async function createProjectAction(data: {
  name: string
  topic?: string
  genre?: string
}) {
  const p = await createProject(data)
  revalidatePath("/")
  return p
}

export async function deleteProjectAction(projectId: string) {
  await deleteProject(projectId)
  revalidatePath("/")
}

export async function updateProjectAction(
  projectId: string,
  data: Parameters<typeof updateProjectMeta>[1]
) {
  const p = await updateProjectMeta(projectId, data)
  revalidatePath("/")
  revalidatePath(`/${projectId}`)
  return p
}
