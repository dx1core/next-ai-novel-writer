import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getProjectById } from "@/lib/db/projects"

type Props = { params: Promise<{ projectId: string }> }

export default async function ChaptersIndex({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  const ch = await prisma.chapter.findMany({
    where: { projectId },
    orderBy: { number: "asc" },
  })
  return (
    <div>
      <h1 className="font-bold text-2xl tracking-[-0.03em]">章节</h1>
      <p className="text-muted-foreground text-sm">点击章节号编辑正文草稿。</p>
      <ul className="mt-3 space-y-1 text-sm">
        {ch.length === 0 ? (
          <li className="text-muted-foreground">
            尚无章节，请先在主控台 Step3 生成。
          </li>
        ) : null}
        {ch.map((c) => (
          <li key={c.id}>
            <Link
              className="hover:underline"
              href={`/${projectId}/chapters/${c.number}`}
            >
              第 {c.number} 章
            </Link>
            <span className="ml-2 text-muted-foreground text-xs">
              ({c.status})
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
