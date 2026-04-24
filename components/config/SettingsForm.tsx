"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  createEmbeddingProfileAction,
  createLlmProfileAction,
  updateProjectModelAssignmentsAction,
} from "@/app/actions/profiles"
import { updateProjectAction } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"

type Row = {
  id: string
  name: string
  interfaceFormat: string
  modelName: string
}
type EmRow = { id: string; name: string; modelName: string }

type Props = {
  projectId: string
  project: {
    id: string
    topic: string
    genre: string
    numChapters: number
    wordNumber: number
    currentChapter: number
    userGuidance: string
  }
  settings: {
    architectureLlmId: string | null
    blueprintLlmId: string | null
    draftLlmId: string | null
    finalizeLlmId: string | null
    consistencyLlmId: string | null
    embeddingProfileId: string | null
    proxyEnabled: boolean
    proxyUrl: string
    proxyPort: string
  } | null
  llmProfiles: Row[]
  embeddingProfiles: EmRow[]
}

export function SettingsForm({
  projectId,
  project,
  settings,
  llmProfiles,
  embeddingProfiles,
}: Props) {
  const [topic, setTopic] = useState(project.topic)
  const [genre, setGenre] = useState(project.genre)
  const [num, setNum] = useState(String(project.numChapters))
  const [word, setWord] = useState(String(project.wordNumber))
  const [cur, setCur] = useState(String(project.currentChapter))
  const [ug, setUg] = useState(project.userGuidance)
  const [a, setA] = useState(settings?.architectureLlmId ?? "")
  const [b, setB] = useState(settings?.blueprintLlmId ?? "")
  const [d, setD] = useState(settings?.draftLlmId ?? "")
  const [f, setF] = useState(settings?.finalizeLlmId ?? "")
  const [c, setC] = useState(settings?.consistencyLlmId ?? "")
  const [e, setE] = useState(settings?.embeddingProfileId ?? "")
  const [busy, setBusy] = useState(false)
  const [newLlm, setNewLlm] = useState({
    name: "My LLM",
    interfaceFormat: "openai",
    baseUrl: "https://api.openai.com/v1",
    modelName: "gpt-4o-mini",
    apiKey: "",
  })
  const [newEmb, setNewEmb] = useState({
    name: "My Emb",
    interfaceFormat: "openai",
    baseUrl: "https://api.openai.com/v1",
    modelName: "text-embedding-3-small",
    apiKey: "",
  })
  const router = useRouter()

  const options = (rows: Row[]) =>
    rows.map((r) => (
      <option key={r.id} value={r.id}>
        {r.name} — {r.modelName}
      </option>
    ))

  return (
    <div className="max-w-2xl space-y-6 text-sm">
      <section>
        <h2 className="font-medium text-sm">小说参数</h2>
        <div className="mt-2 flex flex-col gap-2">
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setTopic(e.target.value)
            }}
            placeholder="主题 topic"
            value={topic}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setGenre(e.target.value)
            }}
            placeholder="类型 genre"
            value={genre}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              className="rounded border border-input p-2"
              onChange={(e) => {
                setNum(e.target.value)
              }}
              placeholder="总章数"
              value={num}
            />
            <input
              className="rounded border border-input p-2"
              onChange={(e) => {
                setWord(e.target.value)
              }}
              placeholder="每章字数"
              value={word}
            />
            <input
              className="rounded border border-input p-2"
              onChange={(e) => {
                setCur(e.target.value)
              }}
              placeholder="当前章节"
              value={cur}
            />
          </div>
          <textarea
            className="min-h-24 rounded border border-input p-2"
            onChange={(e) => {
              setUg(e.target.value)
            }}
            placeholder="内容指导"
            value={ug}
          />
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await updateProjectAction(projectId, {
                topic,
                genre,
                numChapters: Number.parseInt(num, 10) || 10,
                wordNumber: Number.parseInt(word, 10) || 3000,
                currentChapter: Number.parseInt(cur, 10) || 1,
                userGuidance: ug,
              })
              setBusy(false)
              router.refresh()
            }}
            type="button"
          >
            保存小说参数
          </Button>
        </div>
      </section>
      <section>
        <h2 className="font-medium text-sm">各步模型分配</h2>
        <p className="text-muted-foreground text-xs">
          从上表选择；若为空请先新建档案。
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <label className="grid grid-cols-[8rem_1fr] items-center gap-2">
            架构
            <select
              className="rounded border border-input p-2"
              onChange={(ev) => {
                setA(ev.target.value)
              }}
              value={a}
            >
              <option value="">—</option>
              {options(llmProfiles)}
            </select>
          </label>
          <label className="grid grid-cols-[8rem_1fr] items-center gap-2">
            大目录
            <select
              className="rounded border border-input p-2"
              onChange={(ev) => {
                setB(ev.target.value)
              }}
              value={b}
            >
              <option value="">—</option>
              {options(llmProfiles)}
            </select>
          </label>
          <label className="grid grid-cols-[8rem_1fr] items-center gap-2">
            草稿
            <select
              className="rounded border border-input p-2"
              onChange={(ev) => {
                setD(ev.target.value)
              }}
              value={d}
            >
              <option value="">—</option>
              {options(llmProfiles)}
            </select>
          </label>
          <label className="grid grid-cols-[8rem_1fr] items-center gap-2">
            定稿
            <select
              className="rounded border border-input p-2"
              onChange={(ev) => {
                setF(ev.target.value)
              }}
              value={f}
            >
              <option value="">—</option>
              {options(llmProfiles)}
            </select>
          </label>
          <label className="grid grid-cols-[8rem_1fr] items-center gap-2">
            审校
            <select
              className="rounded border border-input p-2"
              onChange={(ev) => {
                setC(ev.target.value)
              }}
              value={c}
            >
              <option value="">—</option>
              {options(llmProfiles)}
            </select>
          </label>
          <label className="grid grid-cols-[8rem_1fr] items-center gap-2">
            Embedding
            <select
              className="rounded border border-input p-2"
              onChange={(ev) => {
                setE(ev.target.value)
              }}
              value={e}
            >
              <option value="">—</option>
              {embeddingProfiles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.modelName}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await updateProjectModelAssignmentsAction(projectId, {
                architectureLlmId: a || null,
                blueprintLlmId: b || null,
                draftLlmId: d || null,
                finalizeLlmId: f || null,
                consistencyLlmId: c || null,
                embeddingProfileId: e || null,
              })
              setBusy(false)
              router.refresh()
            }}
            type="button"
          >
            保存模型分配
          </Button>
        </div>
      </section>
      <section>
        <h2 className="font-medium text-sm">新建 LLM 档案</h2>
        <div className="mt-2 flex flex-col gap-2">
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewLlm((x) => ({ ...x, name: e.target.value }))
            }}
            value={newLlm.name}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewLlm((x) => ({ ...x, interfaceFormat: e.target.value }))
            }}
            placeholder="interface: openai / ollama / gemini / azure openai / azure ai"
            value={newLlm.interfaceFormat}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewLlm((x) => ({ ...x, baseUrl: e.target.value }))
            }}
            value={newLlm.baseUrl}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewLlm((x) => ({ ...x, modelName: e.target.value }))
            }}
            value={newLlm.modelName}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewLlm((x) => ({ ...x, apiKey: e.target.value }))
            }}
            placeholder="API Key"
            type="password"
            value={newLlm.apiKey}
          />
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await createLlmProfileAction({
                ...newLlm,
                temperature: 0.7,
                maxTokens: 8192,
                timeout: 600,
              })
              setBusy(false)
              router.refresh()
            }}
            type="button"
            variant="secondary"
          >
            添加 LLM
          </Button>
        </div>
      </section>
      <section>
        <h2 className="font-medium text-sm">新建 Embedding 档案</h2>
        <div className="mt-2 flex flex-col gap-2">
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewEmb((x) => ({ ...x, name: e.target.value }))
            }}
            value={newEmb.name}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewEmb((x) => ({ ...x, interfaceFormat: e.target.value }))
            }}
            value={newEmb.interfaceFormat}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewEmb((x) => ({ ...x, baseUrl: e.target.value }))
            }}
            value={newEmb.baseUrl}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewEmb((x) => ({ ...x, modelName: e.target.value }))
            }}
            value={newEmb.modelName}
          />
          <input
            className="rounded border border-input p-2"
            onChange={(e) => {
              setNewEmb((x) => ({ ...x, apiKey: e.target.value }))
            }}
            type="password"
            value={newEmb.apiKey}
          />
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await createEmbeddingProfileAction({ ...newEmb, retrievalK: 4 })
              setBusy(false)
              router.refresh()
            }}
            type="button"
            variant="secondary"
          >
            添加 Embedding
          </Button>
        </div>
      </section>
    </div>
  )
}
