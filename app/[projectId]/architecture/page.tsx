import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/db/projects"
import { ArchitectureForm } from "./ArchitectureForm"

type Props = { params: Promise<{ projectId: string }> }

export default async function ArchitecturePage({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  const c = p.architecture?.content ?? ""
  return (
    <div>
      <h1 className="font-bold text-2xl tracking-[-0.03em]">小说架构</h1>
      <div className="mt-4">
        <ArchitectureForm initialValue={c} projectId={projectId} />
      </div>
    </div>
  )
}
