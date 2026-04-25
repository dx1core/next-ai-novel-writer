import { notFound } from "next/navigation"
import { getChapter } from "@/lib/db/chapters"
import { getProjectById } from "@/lib/db/projects"
import { ChapterTextForm } from "../ChapterTextForm"

type Props = { params: Promise<{ projectId: string; chapterNumber: string }> }

export default async function ChapterDetail({ params }: Props) {
  const { projectId, chapterNumber: cn } = await params
  const n = Number.parseInt(cn, 10)
  if (Number.isNaN(n)) {
    notFound()
  }
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  const ch = await getChapter(projectId, n)
  if (!ch) {
    notFound()
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <h1 className="shrink-0 font-bold text-2xl tracking-[-0.03em]">
        第 {n} 章
      </h1>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChapterTextForm
          chapterNumber={n}
          initialValue={ch.draftContent}
          projectId={projectId}
        />
      </div>
    </div>
  )
}
