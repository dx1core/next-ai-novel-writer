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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <h1 className="shrink-0 font-bold text-2xl tracking-[-0.03em]">
        全局摘要
      </h1>
      <div className="flex min-h-0 flex-1 flex-col">
        <StateTextForm
          initialValue={p.globalSummary?.content ?? ""}
          projectId={projectId}
          which="summary"
        />
      </div>
    </div>
  )
}
