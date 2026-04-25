import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/db/projects"
import { BlueprintForm } from "./BlueprintForm"

type Props = { params: Promise<{ projectId: string }> }

export default async function BlueprintPage({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <h1 className="shrink-0 font-bold text-2xl tracking-[-0.03em]">
        章节目录
      </h1>
      <div className="flex min-h-0 flex-1 flex-col">
        <BlueprintForm
          initialValue={p.blueprint?.content ?? ""}
          projectId={projectId}
        />
      </div>
    </div>
  )
}
