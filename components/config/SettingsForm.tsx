"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import {
  createEmbeddingProfileAction,
  createLlmProfileAction,
  deleteEmbeddingProfileAction,
  deleteLlmProfileAction,
  updateEmbeddingProfileAction,
  updateLlmProfileAction,
  updateProjectModelAssignmentsAction,
} from "@/app/actions/profiles"
import { updateProjectAction } from "@/app/actions/projects"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Row = {
  id: string
  name: string
  interfaceFormat: string
  modelName: string
  baseUrl: string
  apiKey: string
}
type EmbRow = {
  id: string
  name: string
  interfaceFormat: string
  baseUrl: string
  modelName: string
  apiKey: string
  retrievalK: number
}

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
  embeddingProfiles: EmbRow[]
}

function llmPickLabel(id: string, rows: Row[]): string {
  if (!id) {
    return "—"
  }
  const r = rows.find((x) => x.id === id)
  return r ? `${r.name} — ${r.modelName}` : "（档案不存在或已删除）"
}

function embPickLabel(id: string, rows: EmbRow[]): string {
  if (!id) {
    return "—"
  }
  const r = rows.find((x) => x.id === id)
  return r ? `${r.name} — ${r.modelName}` : "（档案不存在或已删除）"
}

export function SettingsForm({
  projectId,
  project,
  settings,
  llmProfiles,
  embeddingProfiles,
}: Props) {
  const [novelDialogOpen, setNovelDialogOpen] = useState(false)
  const [novelDraft, setNovelDraft] = useState({
    topic: "",
    genre: "",
    num: "",
    word: "",
    cur: "",
    ug: "",
  })
  const [a, setA] = useState(settings?.architectureLlmId ?? "")
  const [b, setB] = useState(settings?.blueprintLlmId ?? "")
  const [d, setD] = useState(settings?.draftLlmId ?? "")
  const [f, setF] = useState(settings?.finalizeLlmId ?? "")
  const [c, setC] = useState(settings?.consistencyLlmId ?? "")
  const [e, setE] = useState(settings?.embeddingProfileId ?? "")
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignDraft, setAssignDraft] = useState({
    architecture: "",
    blueprint: "",
    draft: "",
    finalize: "",
    consistency: "",
    embedding: "",
  })
  const [busy, setBusy] = useState(false)
  const [llmDialogOpen, setLlmDialogOpen] = useState(false)
  const [editingLlmId, setEditingLlmId] = useState<string | null>(null)
  const [llmForm, setLlmForm] = useState({
    name: "My LLM",
    interfaceFormat: "openai",
    baseUrl: "https://api.openai.com/v1",
    modelName: "gpt-4o-mini",
    apiKey: "",
  })
  const [embDialogOpen, setEmbDialogOpen] = useState(false)
  const [editingEmbId, setEditingEmbId] = useState<string | null>(null)
  const [embForm, setEmbForm] = useState({
    name: "My Emb",
    interfaceFormat: "openai",
    baseUrl: "https://api.openai.com/v1",
    modelName: "text-embedding-3-small",
    apiKey: "",
    retrievalK: 4,
  })
  const router = useRouter()

  const assignSelectClass =
    "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"

  const options = (rows: Row[]) =>
    rows.map((r) => (
      <option key={r.id} value={r.id}>
        {r.name} — {r.modelName}
      </option>
    ))

  const embOptions = (rows: EmbRow[]) =>
    rows.map((r) => (
      <option key={r.id} value={r.id}>
        {r.name} — {r.modelName}
      </option>
    ))

  const openNovelDialog = () => {
    setNovelDraft({
      topic: project.topic,
      genre: project.genre,
      num: String(project.numChapters),
      word: String(project.wordNumber),
      cur: String(project.currentChapter),
      ug: project.userGuidance,
    })
    setNovelDialogOpen(true)
  }

  const submitNovelForm = async (ev: FormEvent) => {
    ev.preventDefault()
    setBusy(true)
    try {
      await updateProjectAction(projectId, {
        topic: novelDraft.topic,
        genre: novelDraft.genre,
        numChapters: Number.parseInt(novelDraft.num, 10) || 10,
        wordNumber: Number.parseInt(novelDraft.word, 10) || 3000,
        currentChapter: Number.parseInt(novelDraft.cur, 10) || 1,
        userGuidance: novelDraft.ug,
      })
      setNovelDialogOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const openAssignDialog = () => {
    setAssignDraft({
      architecture: a,
      blueprint: b,
      draft: d,
      finalize: f,
      consistency: c,
      embedding: e,
    })
    setAssignDialogOpen(true)
  }

  const submitAssignForm = async (ev: FormEvent) => {
    ev.preventDefault()
    setBusy(true)
    try {
      await updateProjectModelAssignmentsAction(projectId, {
        architectureLlmId: assignDraft.architecture || null,
        blueprintLlmId: assignDraft.blueprint || null,
        draftLlmId: assignDraft.draft || null,
        finalizeLlmId: assignDraft.finalize || null,
        consistencyLlmId: assignDraft.consistency || null,
        embeddingProfileId: assignDraft.embedding || null,
      })
      setA(assignDraft.architecture)
      setB(assignDraft.blueprint)
      setD(assignDraft.draft)
      setF(assignDraft.finalize)
      setC(assignDraft.consistency)
      setE(assignDraft.embedding)
      setAssignDialogOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const openNewLlmDialog = () => {
    setEditingLlmId(null)
    setLlmForm({
      name: "My LLM",
      interfaceFormat: "openai",
      baseUrl: "https://api.openai.com/v1",
      modelName: "gpt-4o-mini",
      apiKey: "",
    })
    setLlmDialogOpen(true)
  }

  const openEditLlmDialog = (row: Row) => {
    setEditingLlmId(row.id)
    setLlmForm({
      name: row.name,
      interfaceFormat: row.interfaceFormat,
      baseUrl: row.baseUrl,
      modelName: row.modelName,
      apiKey: row.apiKey,
    })
    setLlmDialogOpen(true)
  }

  const submitLlmForm = async (ev: FormEvent) => {
    ev.preventDefault()
    setBusy(true)
    try {
      if (editingLlmId) {
        await updateLlmProfileAction(editingLlmId, { ...llmForm })
      } else {
        await createLlmProfileAction({
          ...llmForm,
          temperature: 0.7,
          maxTokens: 8192,
          timeout: 600,
        })
      }
      setLlmDialogOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const clearLocalAssignmentsIfProfileRemoved = (removedId: string) => {
    setA((x) => (x === removedId ? "" : x))
    setB((x) => (x === removedId ? "" : x))
    setD((x) => (x === removedId ? "" : x))
    setF((x) => (x === removedId ? "" : x))
    setC((x) => (x === removedId ? "" : x))
  }

  const deleteLlmRow = async (row: Row) => {
    if (
      !window.confirm(
        `确定删除档案「${row.name}」？所有项目中引用该档案的步骤将恢复为未选择。`
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await deleteLlmProfileAction(row.id, projectId)
      clearLocalAssignmentsIfProfileRemoved(row.id)
      if (editingLlmId === row.id) {
        setEditingLlmId(null)
        setLlmDialogOpen(false)
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const openNewEmbDialog = () => {
    setEditingEmbId(null)
    setEmbForm({
      name: "My Emb",
      interfaceFormat: "openai",
      baseUrl: "https://api.openai.com/v1",
      modelName: "text-embedding-3-small",
      apiKey: "",
      retrievalK: 4,
    })
    setEmbDialogOpen(true)
  }

  const openEditEmbDialog = (row: EmbRow) => {
    setEditingEmbId(row.id)
    setEmbForm({
      name: row.name,
      interfaceFormat: row.interfaceFormat,
      baseUrl: row.baseUrl,
      modelName: row.modelName,
      apiKey: row.apiKey,
      retrievalK: row.retrievalK,
    })
    setEmbDialogOpen(true)
  }

  const submitEmbForm = async (ev: FormEvent) => {
    ev.preventDefault()
    setBusy(true)
    try {
      const retrievalK = Math.max(
        1,
        Math.floor(Number(embForm.retrievalK) || 4)
      )
      if (editingEmbId) {
        await updateEmbeddingProfileAction(editingEmbId, {
          ...embForm,
          retrievalK,
        })
      } else {
        await createEmbeddingProfileAction({
          name: embForm.name,
          interfaceFormat: embForm.interfaceFormat,
          apiKey: embForm.apiKey,
          baseUrl: embForm.baseUrl,
          modelName: embForm.modelName,
          retrievalK,
        })
      }
      setEmbDialogOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const clearLocalEmbeddingIfRemoved = (removedId: string) => {
    setE((x) => (x === removedId ? "" : x))
  }

  const deleteEmbRow = async (row: EmbRow) => {
    if (
      !window.confirm(
        `确定删除档案「${row.name}」？所有项目中引用该 Embedding 的步骤将恢复为未选择。`
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await deleteEmbeddingProfileAction(row.id, projectId)
      clearLocalEmbeddingIfRemoved(row.id)
      if (editingEmbId === row.id) {
        setEditingEmbId(null)
        setEmbDialogOpen(false)
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 text-sm">
      <section>
        <Card size="sm">
          <CardHeader className="border-border border-b pb-4">
            <CardTitle className="font-semibold text-base">小说参数</CardTitle>
            <CardAction>
              <Button
                aria-label="编辑小说参数"
                disabled={busy}
                onClick={openNovelDialog}
                size="icon-sm"
                title="编辑"
                type="button"
                variant="outline"
              >
                <Pencil />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1">
                <span className="font-medium text-muted-foreground text-xs">
                  主题
                </span>
                <p className="text-foreground leading-snug">
                  {project.topic.trim() ? project.topic : "—"}
                </p>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-muted-foreground text-xs">
                  类型 / 题材
                </span>
                <p className="text-foreground leading-snug">
                  {project.genre.trim() ? project.genre : "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1">
                <span className="font-medium text-muted-foreground text-xs">
                  总章数
                </span>
                <p className="text-foreground tabular-nums">
                  {project.numChapters}
                </p>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-muted-foreground text-xs">
                  每章目标字数
                </span>
                <p className="text-foreground tabular-nums">
                  {project.wordNumber}
                </p>
              </div>
              <div className="grid gap-1">
                <span className="font-medium text-muted-foreground text-xs">
                  当前章节
                </span>
                <p className="text-foreground tabular-nums">
                  {project.currentChapter}
                </p>
              </div>
            </div>
            <div className="grid gap-1">
              <span className="font-medium text-muted-foreground text-xs">
                内容指导
              </span>
              <p className="whitespace-pre-wrap text-foreground leading-snug">
                {project.userGuidance.trim() ? project.userGuidance : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog.Root onOpenChange={setNovelDialogOpen} open={novelDialogOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop
              className={cn(
                "fixed inset-0 z-50 bg-black/50",
                "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
              )}
            />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
              <Dialog.Popup
                className={cn(
                  "w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg outline-none",
                  "data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
                  "max-h-[min(90vh,36rem)] overflow-y-auto"
                )}
              >
                <Dialog.Title className="font-semibold text-base tracking-tight">
                  编辑小说参数
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-muted-foreground text-xs">
                  修改后保存将写入当前项目。
                </Dialog.Description>
                <form className="mt-4 space-y-3" onSubmit={submitNovelForm}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="novel-form-topic">主题</Label>
                    <Input
                      autoComplete="off"
                      id="novel-form-topic"
                      onChange={(e) => {
                        setNovelDraft((x) => ({ ...x, topic: e.target.value }))
                      }}
                      value={novelDraft.topic}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="novel-form-genre">类型 / 题材</Label>
                    <Input
                      autoComplete="off"
                      id="novel-form-genre"
                      onChange={(e) => {
                        setNovelDraft((x) => ({ ...x, genre: e.target.value }))
                      }}
                      value={novelDraft.genre}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="novel-form-num">总章数</Label>
                      <Input
                        autoComplete="off"
                        id="novel-form-num"
                        min={1}
                        onChange={(e) => {
                          setNovelDraft((x) => ({ ...x, num: e.target.value }))
                        }}
                        type="number"
                        value={novelDraft.num}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="novel-form-word">每章目标字数</Label>
                      <Input
                        autoComplete="off"
                        id="novel-form-word"
                        min={1}
                        onChange={(e) => {
                          setNovelDraft((x) => ({ ...x, word: e.target.value }))
                        }}
                        type="number"
                        value={novelDraft.word}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="novel-form-cur">当前章节</Label>
                      <Input
                        autoComplete="off"
                        id="novel-form-cur"
                        min={1}
                        onChange={(e) => {
                          setNovelDraft((x) => ({ ...x, cur: e.target.value }))
                        }}
                        type="number"
                        value={novelDraft.cur}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="novel-form-ug">内容指导</Label>
                    <Textarea
                      className="min-h-24"
                      id="novel-form-ug"
                      onChange={(e) => {
                        setNovelDraft((x) => ({ ...x, ug: e.target.value }))
                      }}
                      value={novelDraft.ug}
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-2 border-border border-t pt-4">
                    <Dialog.Close
                      className={cn(buttonVariants({ variant: "outline" }))}
                      disabled={busy}
                      type="button"
                    >
                      取消
                    </Dialog.Close>
                    <Button disabled={busy} type="submit">
                      保存
                    </Button>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
      <section>
        <Card size="sm">
          <CardHeader className="border-border border-b pb-4">
            <CardTitle className="font-semibold text-base">
              各步模型分配
            </CardTitle>
            <CardAction>
              <Button
                aria-label="编辑模型分配"
                disabled={busy}
                onClick={openAssignDialog}
                size="icon-sm"
                title="编辑"
                type="button"
                variant="outline"
              >
                <Pencil />
              </Button>
            </CardAction>
            <CardDescription className="text-xs">
              为各流水线步骤选择 LLM 与
              Embedding；下拉为空时请先在下方卡片中新建档案。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-1">
              <span className="font-medium text-muted-foreground text-xs">
                架构生成
              </span>
              <p className="leading-snug">{llmPickLabel(a, llmProfiles)}</p>
            </div>
            <div className="grid gap-1">
              <span className="font-medium text-muted-foreground text-xs">
                章节目录 / 大目录
              </span>
              <p className="leading-snug">{llmPickLabel(b, llmProfiles)}</p>
            </div>
            <div className="grid gap-1">
              <span className="font-medium text-muted-foreground text-xs">
                章节草稿
              </span>
              <p className="leading-snug">{llmPickLabel(d, llmProfiles)}</p>
            </div>
            <div className="grid gap-1">
              <span className="font-medium text-muted-foreground text-xs">
                定稿
              </span>
              <p className="leading-snug">{llmPickLabel(f, llmProfiles)}</p>
            </div>
            <div className="grid gap-1">
              <span className="font-medium text-muted-foreground text-xs">
                一致性审校
              </span>
              <p className="leading-snug">{llmPickLabel(c, llmProfiles)}</p>
            </div>
            <div className="grid gap-1">
              <span className="font-medium text-muted-foreground text-xs">
                Embedding（向量检索）
              </span>
              <p className="leading-snug">
                {embPickLabel(e, embeddingProfiles)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog.Root onOpenChange={setAssignDialogOpen} open={assignDialogOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop
              className={cn(
                "fixed inset-0 z-50 bg-black/50",
                "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
              )}
            />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
              <Dialog.Popup
                className={cn(
                  "w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg outline-none",
                  "data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
                  "max-h-[min(90vh,36rem)] overflow-y-auto"
                )}
              >
                <Dialog.Title className="font-semibold text-base tracking-tight">
                  编辑模型分配
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-muted-foreground text-xs">
                  为各步骤选择 LLM 或 Embedding 档案，保存后生效。
                </Dialog.Description>
                <form className="mt-4 space-y-3" onSubmit={submitAssignForm}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="assign-dialog-architecture">架构生成</Label>
                    <select
                      className={assignSelectClass}
                      id="assign-dialog-architecture"
                      onChange={(ev) => {
                        setAssignDraft((x) => ({
                          ...x,
                          architecture: ev.target.value,
                        }))
                      }}
                      value={assignDraft.architecture}
                    >
                      <option value="">—</option>
                      {options(llmProfiles)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="assign-dialog-blueprint">
                      章节目录 / 大目录
                    </Label>
                    <select
                      className={assignSelectClass}
                      id="assign-dialog-blueprint"
                      onChange={(ev) => {
                        setAssignDraft((x) => ({
                          ...x,
                          blueprint: ev.target.value,
                        }))
                      }}
                      value={assignDraft.blueprint}
                    >
                      <option value="">—</option>
                      {options(llmProfiles)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="assign-dialog-draft">章节草稿</Label>
                    <select
                      className={assignSelectClass}
                      id="assign-dialog-draft"
                      onChange={(ev) => {
                        setAssignDraft((x) => ({
                          ...x,
                          draft: ev.target.value,
                        }))
                      }}
                      value={assignDraft.draft}
                    >
                      <option value="">—</option>
                      {options(llmProfiles)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="assign-dialog-finalize">定稿</Label>
                    <select
                      className={assignSelectClass}
                      id="assign-dialog-finalize"
                      onChange={(ev) => {
                        setAssignDraft((x) => ({
                          ...x,
                          finalize: ev.target.value,
                        }))
                      }}
                      value={assignDraft.finalize}
                    >
                      <option value="">—</option>
                      {options(llmProfiles)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="assign-dialog-consistency">
                      一致性审校
                    </Label>
                    <select
                      className={assignSelectClass}
                      id="assign-dialog-consistency"
                      onChange={(ev) => {
                        setAssignDraft((x) => ({
                          ...x,
                          consistency: ev.target.value,
                        }))
                      }}
                      value={assignDraft.consistency}
                    >
                      <option value="">—</option>
                      {options(llmProfiles)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="assign-dialog-embedding">
                      Embedding（向量检索）
                    </Label>
                    <select
                      className={assignSelectClass}
                      id="assign-dialog-embedding"
                      onChange={(ev) => {
                        setAssignDraft((x) => ({
                          ...x,
                          embedding: ev.target.value,
                        }))
                      }}
                      value={assignDraft.embedding}
                    >
                      <option value="">—</option>
                      {embOptions(embeddingProfiles)}
                    </select>
                  </div>
                  <div className="mt-6 flex justify-end gap-2 border-border border-t pt-4">
                    <Dialog.Close
                      className={cn(buttonVariants({ variant: "outline" }))}
                      disabled={busy}
                      type="button"
                    >
                      取消
                    </Dialog.Close>
                    <Button disabled={busy} type="submit">
                      保存
                    </Button>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
      <section>
        <Card size="sm">
          <CardHeader className="border-border border-b pb-4">
            <CardTitle className="font-semibold text-base">LLM 档案</CardTitle>
            <CardAction>
              <Button
                disabled={busy}
                onClick={openNewLlmDialog}
                type="button"
                variant="secondary"
              >
                新增
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-4">
            {llmProfiles.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                暂无档案，点击「新增」创建。
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {llmProfiles.map((row) => (
                  <li
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                    key={row.id}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.name}</div>
                      <div className="truncate text-muted-foreground text-xs">
                        {row.modelName} · {row.interfaceFormat}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        aria-label={`编辑 ${row.name}`}
                        disabled={busy}
                        onClick={() => {
                          openEditLlmDialog(row)
                        }}
                        size="icon-sm"
                        title="编辑"
                        type="button"
                        variant="outline"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label={`删除 ${row.name}`}
                        disabled={busy}
                        onClick={() => {
                          void deleteLlmRow(row)
                        }}
                        size="icon-sm"
                        title="删除"
                        type="button"
                        variant="destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Dialog.Root onOpenChange={setLlmDialogOpen} open={llmDialogOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop
              className={cn(
                "fixed inset-0 z-50 bg-black/50",
                "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
              )}
            />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
              <Dialog.Popup
                className={cn(
                  "w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg outline-none",
                  "data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
                  "max-h-[min(90vh,36rem)] overflow-y-auto"
                )}
              >
                <Dialog.Title className="font-semibold text-base tracking-tight">
                  {editingLlmId ? "编辑 LLM 档案" : "新建 LLM 档案"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-muted-foreground text-xs">
                  填写接口类型、服务地址、模型名与访问密钥。保存后可在上方「各步模型分配」中选用。
                </Dialog.Description>
                <form className="mt-4 space-y-3" onSubmit={submitLlmForm}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="llm-form-name">名称</Label>
                    <Input
                      autoComplete="off"
                      id="llm-form-name"
                      onChange={(e) => {
                        setLlmForm((x) => ({ ...x, name: e.target.value }))
                      }}
                      value={llmForm.name}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="llm-form-interface">接口类型</Label>
                    <Input
                      autoComplete="off"
                      id="llm-form-interface"
                      onChange={(e) => {
                        setLlmForm((x) => ({
                          ...x,
                          interfaceFormat: e.target.value,
                        }))
                      }}
                      placeholder="openai / ollama / gemini / azure openai / …"
                      value={llmForm.interfaceFormat}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="llm-form-baseurl">Base URL</Label>
                    <Input
                      autoComplete="off"
                      id="llm-form-baseurl"
                      onChange={(e) => {
                        setLlmForm((x) => ({ ...x, baseUrl: e.target.value }))
                      }}
                      value={llmForm.baseUrl}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="llm-form-model">模型名</Label>
                    <Input
                      autoComplete="off"
                      id="llm-form-model"
                      onChange={(e) => {
                        setLlmForm((x) => ({ ...x, modelName: e.target.value }))
                      }}
                      value={llmForm.modelName}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="llm-form-apikey">API Key</Label>
                    <Input
                      autoComplete="off"
                      id="llm-form-apikey"
                      onChange={(e) => {
                        setLlmForm((x) => ({ ...x, apiKey: e.target.value }))
                      }}
                      type="password"
                      value={llmForm.apiKey}
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-2 border-border border-t pt-4">
                    <Dialog.Close
                      className={cn(buttonVariants({ variant: "outline" }))}
                      disabled={busy}
                      type="button"
                    >
                      取消
                    </Dialog.Close>
                    <Button disabled={busy} type="submit">
                      保存
                    </Button>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
      <section>
        <Card size="sm">
          <CardHeader className="border-border border-b pb-4">
            <CardTitle className="font-semibold text-base">
              Embedding 档案
            </CardTitle>
            <CardAction>
              <Button
                disabled={busy}
                onClick={openNewEmbDialog}
                type="button"
                variant="secondary"
              >
                新增
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-4">
            {embeddingProfiles.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                暂无档案，点击「新增」创建。
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {embeddingProfiles.map((row) => (
                  <li
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                    key={row.id}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.name}</div>
                      <div className="truncate text-muted-foreground text-xs">
                        {row.modelName} · {row.interfaceFormat} · 检索 top-
                        {row.retrievalK}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        aria-label={`编辑 ${row.name}`}
                        disabled={busy}
                        onClick={() => {
                          openEditEmbDialog(row)
                        }}
                        size="icon-sm"
                        title="编辑"
                        type="button"
                        variant="outline"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label={`删除 ${row.name}`}
                        disabled={busy}
                        onClick={() => {
                          void deleteEmbRow(row)
                        }}
                        size="icon-sm"
                        title="删除"
                        type="button"
                        variant="destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Dialog.Root onOpenChange={setEmbDialogOpen} open={embDialogOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop
              className={cn(
                "fixed inset-0 z-50 bg-black/50",
                "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
              )}
            />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
              <Dialog.Popup
                className={cn(
                  "w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg outline-none",
                  "data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
                  "max-h-[min(90vh,36rem)] overflow-y-auto"
                )}
              >
                <Dialog.Title className="font-semibold text-base tracking-tight">
                  {editingEmbId ? "编辑 Embedding 档案" : "新建 Embedding 档案"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-muted-foreground text-xs">
                  用于章节与知识库的向量检索。保存后可在上方「各步模型分配」中绑定。
                </Dialog.Description>
                <form className="mt-4 space-y-3" onSubmit={submitEmbForm}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emb-form-name">名称</Label>
                    <Input
                      autoComplete="off"
                      id="emb-form-name"
                      onChange={(e) => {
                        setEmbForm((x) => ({ ...x, name: e.target.value }))
                      }}
                      value={embForm.name}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emb-form-interface">接口类型</Label>
                    <Input
                      autoComplete="off"
                      id="emb-form-interface"
                      onChange={(e) => {
                        setEmbForm((x) => ({
                          ...x,
                          interfaceFormat: e.target.value,
                        }))
                      }}
                      placeholder="openai / ollama / gemini / …"
                      value={embForm.interfaceFormat}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emb-form-baseurl">Base URL</Label>
                    <Input
                      autoComplete="off"
                      id="emb-form-baseurl"
                      onChange={(e) => {
                        setEmbForm((x) => ({ ...x, baseUrl: e.target.value }))
                      }}
                      value={embForm.baseUrl}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emb-form-model">模型名</Label>
                    <Input
                      autoComplete="off"
                      id="emb-form-model"
                      onChange={(e) => {
                        setEmbForm((x) => ({ ...x, modelName: e.target.value }))
                      }}
                      value={embForm.modelName}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emb-form-retrievalk">
                      检索条数 retrievalK
                    </Label>
                    <Input
                      autoComplete="off"
                      id="emb-form-retrievalk"
                      min={1}
                      onChange={(e) => {
                        setEmbForm((x) => ({
                          ...x,
                          retrievalK: Number.parseInt(e.target.value, 10) || 1,
                        }))
                      }}
                      type="number"
                      value={embForm.retrievalK}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emb-form-apikey">API Key</Label>
                    <Input
                      autoComplete="off"
                      id="emb-form-apikey"
                      onChange={(e) => {
                        setEmbForm((x) => ({ ...x, apiKey: e.target.value }))
                      }}
                      type="password"
                      value={embForm.apiKey}
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-2 border-border border-t pt-4">
                    <Dialog.Close
                      className={cn(buttonVariants({ variant: "outline" }))}
                      disabled={busy}
                      type="button"
                    >
                      取消
                    </Dialog.Close>
                    <Button disabled={busy} type="submit">
                      保存
                    </Button>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
    </div>
  )
}
