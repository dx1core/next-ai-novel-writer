import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/db/projects"
import { StateTextForm } from "../summary/StateTextForm"

type Props = { params: Promise<{ projectId: string }> }

export default async function PlotArcsPage({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  return (
    <div>
      <h1 className="font-bold text-2xl tracking-[-0.03em]">剧情要点</h1>
      <div className="mt-4">
        <StateTextForm
          initialValue={p.plotArcs?.content ?? ""}
          label="plot_arcs"
          projectId={projectId}
          which="plot"
        />
      </div>
    </div>
  )
}
