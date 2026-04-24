import { notFound } from "next/navigation"
import { ProjectConsole } from "@/components/projects/ProjectConsole"
import { getProjectById } from "@/lib/db/projects"

type Props = { params: Promise<{ projectId: string }> }

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  return (
    <div className="max-w-4xl">
      <h1 className="font-bold text-2xl tracking-[-0.03em] sm:text-3xl">
        主控台
      </h1>
      <p className="notion-prose-muted mt-2 text-pretty text-sm">
        Step1 ～ 4 与工具按钮。
      </p>
      <div className="mt-6">
        <ProjectConsole
          project={{
            currentChapter: p.currentChapter,
            userGuidance: p.userGuidance,
            wordNumber: p.wordNumber,
          }}
          projectId={p.id}
        />
      </div>
    </div>
  )
}
