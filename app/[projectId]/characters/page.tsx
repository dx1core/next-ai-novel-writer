import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/db/projects"
import { StateTextForm } from "../summary/StateTextForm"

type Props = { params: Promise<{ projectId: string }> }

export default async function CharactersPage({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  return (
    <div>
      <h1 className="font-bold text-2xl tracking-[-0.03em]">角色状态</h1>
      <div className="mt-4">
        <StateTextForm
          initialValue={p.characterState?.content ?? ""}
          label="character_state"
          projectId={projectId}
          which="character"
        />
      </div>
    </div>
  )
}
