"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type PromptDialogProps = {
  open: boolean
  initialPrompt: string
  onCancel: () => void
  onConfirm: (edited: string) => void
  title?: string
}

export function PromptDialog({
  open,
  initialPrompt,
  onCancel,
  onConfirm,
  title = "当前章节请求提示词（可编辑）",
}: PromptDialogProps) {
  const [text, setText] = useState(initialPrompt)
  useEffect(() => {
    if (open) {
      setText(initialPrompt)
    }
  }, [open, initialPrompt])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onCancel])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="取消"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        type="button"
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4">
        <div
          aria-modal="true"
          className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-lg"
          role="dialog"
        >
          <h2 className="font-medium text-sm">{title}</h2>
          <p className="text-muted-foreground text-xs">字数：{text.length}</p>
          <textarea
            className="min-h-80 w-full rounded-md border border-input p-3 text-sm"
            onChange={(e) => {
              setText(e.target.value)
            }}
            value={text}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel} type="button" variant="outline">
              取消
            </Button>
            <Button
              onClick={() => {
                onConfirm(text)
              }}
              type="button"
            >
              确认并生成
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
