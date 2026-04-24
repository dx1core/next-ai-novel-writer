"use client"

import { useState } from "react"
import { batchChaptersAction } from "@/app/actions/batch"
import type { ChapterParams } from "@/components/generation/ChapterParamsForm"
import { Button } from "@/components/ui/button"

type BatchDialogProps = {
  open: boolean
  onClose: () => void
  projectId: string
  defaultWord: number
  params: ChapterParams
  onLog: (line: string) => void
}

export function BatchDialog({
  open,
  onClose,
  projectId,
  defaultWord,
  params,
  onLog,
}: BatchDialogProps) {
  const [start, setStart] = useState("1")
  const [end, setEnd] = useState("1")
  const [word, setWord] = useState(String(defaultWord))
  const [min, setMin] = useState(String(defaultWord))
  const [enrich, setEnrich] = useState(true)
  const [busy, setBusy] = useState(false)

  if (!open) {
    return null
  }

  const run = async () => {
    setBusy(true)
    onLog("批量生成开始…")
    const r = await batchChaptersAction(
      projectId,
      Number.parseInt(start, 10),
      Number.parseInt(end, 10),
      Number.parseInt(word, 10),
      Number.parseInt(min, 10),
      enrich,
      params
    )
    if (r.ok) {
      for (const l of r.logs) {
        onLog(l)
      }
    } else {
      onLog(`错误：${r.error}`)
    }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="关闭对话框"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        type="button"
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4">
        <div
          aria-modal="true"
          className="pointer-events-auto w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-4"
          role="dialog"
        >
          <h2 className="font-medium text-sm">批量生成章节</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label>
              起始
              <input
                className="mt-1 w-full rounded border border-input p-1"
                onChange={(e) => {
                  setStart(e.target.value)
                }}
                value={start}
              />
            </label>
            <label>
              结束
              <input
                className="mt-1 w-full rounded border border-input p-1"
                onChange={(e) => {
                  setEnd(e.target.value)
                }}
                value={end}
              />
            </label>
            <label>
              期望字数
              <input
                className="mt-1 w-full rounded border border-input p-1"
                onChange={(e) => {
                  setWord(e.target.value)
                }}
                value={word}
              />
            </label>
            <label>
              最低字数
              <input
                className="mt-1 w-full rounded border border-input p-1"
                onChange={(e) => {
                  setMin(e.target.value)
                }}
                value={min}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={enrich}
              onChange={(e) => {
                setEnrich(e.target.checked)
              }}
              type="checkbox"
            />
            低于最低字数 70% 时自动扩写
          </label>
          <div className="flex justify-end gap-2">
            <Button
              disabled={busy}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={busy} onClick={run} type="button">
              {busy ? "处理中…" : "开始"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
