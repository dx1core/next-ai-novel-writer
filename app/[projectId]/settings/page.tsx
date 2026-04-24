import { notFound } from "next/navigation"
import { SettingsForm } from "@/components/config/SettingsForm"
import { listEmbeddingProfiles, listLlmProfiles } from "@/lib/db/profiles"
import { getProjectById } from "@/lib/db/projects"

type Props = { params: Promise<{ projectId: string }> }

export default async function SettingsPage({ params }: Props) {
  const { projectId } = await params
  const p = await getProjectById(projectId)
  if (!p) {
    notFound()
  }
  const [llmProfiles, emb] = await Promise.all([
    listLlmProfiles(),
    listEmbeddingProfiles(),
  ])
  return (
    <div>
      <h1 className="font-bold text-2xl tracking-[-0.03em]">设置</h1>
      <div className="mt-4">
        <SettingsForm
          embeddingProfiles={emb.map((x) => ({
            id: x.id,
            name: x.name,
            modelName: x.modelName,
          }))}
          llmProfiles={llmProfiles.map((x) => ({
            id: x.id,
            name: x.name,
            modelName: x.modelName,
            interfaceFormat: x.interfaceFormat,
          }))}
          project={{
            id: p.id,
            currentChapter: p.currentChapter,
            genre: p.genre,
            numChapters: p.numChapters,
            topic: p.topic,
            userGuidance: p.userGuidance,
            wordNumber: p.wordNumber,
          }}
          projectId={p.id}
          settings={p.settings}
        />
      </div>
    </div>
  )
}
