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
    <div>
      <h1 className="font-bold text-2xl tracking-[-0.03em]">章节目录</h1>
      <div className="mt-4">
        <BlueprintForm
          initialValue={p.blueprint?.content ?? ""}
          projectId={projectId}
        />
      </div>
    </div>
  )
}
