import Link from "next/link"
import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/db/projects"

type Props = {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  const links: { href: string; label: string }[] = [
    { href: `/${projectId}`, label: "主控台" },
    { href: `/${projectId}/settings`, label: "设置" },
    { href: `/${projectId}/architecture`, label: "小说架构" },
    { href: `/${projectId}/blueprint`, label: "章节目录" },
    { href: `/${projectId}/chapters`, label: "章节" },
    { href: `/${projectId}/characters`, label: "角色状态" },
    { href: `/${projectId}/summary`, label: "全局摘要" },
    { href: `/${projectId}/plot-arcs`, label: "剧情要点" },
  ]
  return (
    <div className="flex min-h-svh w-full">
      <aside className="w-56 shrink-0 border-border border-r bg-[var(--sidebar)] px-3 py-5">
        <p className="font-semibold text-[0.94rem] text-foreground leading-snug tracking-[-0.01em]">
          {p.name}
        </p>
        <p className="mt-1 text-[0.8125rem] text-muted-foreground">
          {p.genre || "未分类"}
        </p>
        <nav className="mt-5 flex flex-col gap-0.5">
          {links.map((l) => (
            <Link
              className="rounded-md px-2 py-1.5 font-medium text-[0.94rem] text-foreground/90 transition-colors hover:bg-white/80 hover:text-foreground dark:hover:bg-white/5"
              href={l.href}
              key={l.href}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-muted-foreground text-xs">
          <Link className="notion-link font-medium" href="/">
            ← 返回项目列表
          </Link>
        </p>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-auto bg-background px-5 py-8 sm:px-8">
        {children}
      </main>
    </div>
  )
}
