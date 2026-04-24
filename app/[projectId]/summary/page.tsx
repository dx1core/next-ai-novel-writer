import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/db/projects"
import { StateTextForm } from "./StateTextForm"

type Props = { params: Promise<{ projectId: string }> }

export default async function SummaryPage({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  return (
    <div>
      <h1 className="font-bold text-2xl tracking-[-0.03em]">全局摘要</h1>
      <div className="mt-4">
        <StateTextForm
          initialValue={p.globalSummary?.content ?? ""}
          label="global_summary"
          projectId={projectId}
          which="summary"
        />
      </div>
    </div>
  )
}
