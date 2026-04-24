import Link from "next/link"

export function ProjectCard({
  project,
}: {
  project: { id: string; name: string; topic: string }
}) {
  return (
    <li className="notion-shadow-card flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
      <div>
        <Link
          className="font-semibold text-[0.94rem] text-foreground transition-colors hover:text-primary"
          href={`/${project.id}`}
        >
          {project.name}
        </Link>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {project.topic || "无主题"}
        </p>
      </div>
    </li>
  )
}
