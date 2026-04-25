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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <h1 className="shrink-0 font-bold text-2xl tracking-[-0.03em]">
        小说架构
      </h1>
      <div className="flex min-h-0 flex-1 flex-col">
        <ArchitectureForm initialValue={c} projectId={projectId} />
      </div>
    </div>
  )
}
