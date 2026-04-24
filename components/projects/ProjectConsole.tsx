"use client"

import { useRouter } from "next/navigation"
import { useCallback, useId, useState } from "react"
import { generateNovelArchitectureAction } from "@/app/actions/architecture"
import { generateChapterBlueprintAction } from "@/app/actions/blueprint"
import {
  buildChapterPromptAction,
  generateChapterDraftAction,
} from "@/app/actions/chapter"
import { consistencyCheckAction } from "@/app/actions/consistency"
import { finalizeChapterAction } from "@/app/actions/finalize"
import { importKnowledgeAction } from "@/app/actions/knowledge"
import { clearVectorStoreAction } from "@/app/actions/profiles"
import { BatchDialog } from "@/components/generation/BatchDialog"
import {
  type ChapterParams,
  ChapterParamsForm,
} from "@/components/generation/ChapterParamsForm"
import { LogViewer } from "@/components/generation/LogViewer"
import { PromptDialog } from "@/components/generation/PromptDialog"
import { StepButtons } from "@/components/generation/StepButtons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  projectId: string
  project: {
    currentChapter: number
    wordNumber: number
    userGuidance: string
  }
}

export function ProjectConsole({ projectId, project }: Props) {
  const chapterFieldId = useId()
  const [chapterNum, setChapterNum] = useState(String(project.currentChapter))
  const [params, setParams] = useState<ChapterParams>({
    userGuidance: project.userGuidance,
    charactersInvolved: "",
    keyItems: "",
    sceneLocation: "",
    timeConstraint: "",
  })
  const [logs, setLogs] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState("")
  const [batchOpen, setBatchOpen] = useState(false)
  const router = useRouter()

  const log = useCallback((line: string) => {
    setLogs((l) => [...l, line])
  }, [])

  const step1 = async () => {
    setBusy(true)
    const r = await generateNovelArchitectureAction(projectId)
    if (r.ok) {
      log(`Step1 完成，模型: ${r.model ?? ""}`)
    } else {
      log(`失败: ${r.error}`)
    }
    setBusy(false)
    router.refresh()
  }

  const step2 = async () => {
    setBusy(true)
    const r = await generateChapterBlueprintAction(projectId)
    log(r.ok ? "Step2 完成" : `失败: ${"error" in r ? r.error : ""}`)
    setBusy(false)
    router.refresh()
  }

  const step3 = async () => {
    setBusy(true)
    const n = Number.parseInt(chapterNum, 10) || 1
    const b = await buildChapterPromptAction(projectId, n, params)
    if (b.ok === false) {
      log(`失败: ${b.error}`)
      setBusy(false)
      return
    }
    setPendingPrompt(b.prompt)
    setPromptOpen(true)
    setBusy(false)
  }

  const confirmPrompt = async (text: string) => {
    setPromptOpen(false)
    setBusy(true)
    const n = Number.parseInt(chapterNum, 10) || 1
    const r = await generateChapterDraftAction(projectId, n, params, text)
    log(
      r.ok ? `Step3 第${n}章草稿已保存` : `失败: ${"error" in r ? r.error : ""}`
    )
    setBusy(false)
    router.refresh()
  }

  const step4 = async () => {
    setBusy(true)
    const n = Number.parseInt(chapterNum, 10) || 1
    const r = await finalizeChapterAction(projectId, n)
    log(r.ok ? `Step4 第${n}章定稿` : `失败: ${"error" in r ? r.error : ""}`)
    setBusy(false)
    router.refresh()
  }

  const onConsistency = async () => {
    setBusy(true)
    const n = Number.parseInt(chapterNum, 10) || 1
    const r = await consistencyCheckAction(projectId, n)
    log("可选一致性审校：")
    log(r.ok ? r.result : `失败: ${"error" in r ? r.error : ""}`)
    setBusy(false)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) {
      return
    }
    setBusy(true)
    const fd = new FormData()
    fd.set("file", f)
    const r = await importKnowledgeAction(projectId, fd)
    log(r.ok ? "知识库导入完成" : `导入失败: ${"error" in r ? r.error : ""}`)
    setBusy(false)
  }

  const onClearVector = async () => {
    setBusy(true)
    await clearVectorStoreAction(projectId)
    log("已请求清空向量库")
    setBusy(false)
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <div className="flex flex-col gap-1.5">
          <Label
            className="font-medium text-[0.8125rem] text-foreground/90"
            htmlFor={chapterFieldId}
          >
            当前章节号
          </Label>
          <Input
            className="w-20"
            id={chapterFieldId}
            onChange={(e) => {
              setChapterNum(e.target.value)
            }}
            type="text"
            value={chapterNum}
          />
        </div>
      </div>
      <ChapterParamsForm
        initial={params}
        onChange={(p) => {
          setParams(p)
        }}
      />
      <StepButtons
        busy={busy}
        onStep1={step1}
        onStep2={step2}
        onStep3={step3}
        onStep4={step4}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() => {
            setBatchOpen(true)
          }}
          type="button"
          variant="outline"
        >
          批量生成
        </Button>
        <Button
          disabled={busy}
          onClick={onConsistency}
          type="button"
          variant="outline"
        >
          可选一致性审校
        </Button>
        <label className="text-sm">
          <span className="text-muted-foreground">导入知识库</span>
          <input
            className="ml-2 text-xs"
            disabled={busy}
            onChange={onFile}
            type="file"
          />
        </label>
        <Button
          disabled={busy}
          onClick={onClearVector}
          type="button"
          variant="ghost"
        >
          清空向量库
        </Button>
      </div>
      <div>
        <p className="mb-1 text-muted-foreground text-xs">执行日志</p>
        <LogViewer lines={logs} />
      </div>
      <PromptDialog
        initialPrompt={pendingPrompt}
        onCancel={() => {
          setPromptOpen(false)
        }}
        onConfirm={confirmPrompt}
        open={promptOpen}
      />
      <BatchDialog
        defaultWord={project.wordNumber}
        onClose={() => {
          setBatchOpen(false)
        }}
        onLog={log}
        open={batchOpen}
        params={params}
        projectId={projectId}
      />
    </div>
  )
}
