import Link from "next/link"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectForm } from "@/components/projects/ProjectForm"
import { listProjects } from "@/lib/db/projects"

export default async function Home() {
  const projects = await listProjects()
  return (
    <div className="notion-page">
      <header className="-mx-4 border-border border-b bg-muted/40 px-4 py-8 sm:-mx-6 sm:px-6">
        <h1 className="notion-hero-title">AI 小说生成</h1>
        <p className="notion-prose-muted mt-3 max-w-2xl text-pretty text-base">
          管理项目。每个项目有独立设定、章节目录、章节与 LLM/Embedding
          配置。请先在各项目的「设置」中创建并绑定 LLM 与 Embedding
          档案。向量检索需本机或 Docker 运行 Chroma，见{" "}
          <code className="text-xs">.env</code> 中的
          <code className="text-xs">CHROMA_HOST/CHROMA_PORT</code>。
        </p>
      </header>
      <section className="mt-10">
        <h2>新建</h2>
        <div className="mt-3">
          <ProjectForm />
        </div>
      </section>
      <section className="notion-surface -mx-4 mt-12 rounded-none border-border border-y px-4 py-10 sm:-mx-6 sm:rounded-xl sm:px-6">
        <h2>项目列表</h2>
        {projects.length === 0 ? (
          <p className="notion-prose-muted mt-3 text-sm">
            暂无项目，请先创建。
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={{ id: p.id, name: p.name, topic: p.topic }}
              />
            ))}
          </ul>
        )}
      </section>
      <p className="notion-prose-muted mt-10 text-xs">
        <Link className="notion-link font-medium" href="https://github.com">
          原 Python 项目能力对齐：四步生成、RAG、批量、审校
        </Link>
      </p>
    </div>
  )
}
