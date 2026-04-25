"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TextEditorProps = {
  initialValue: string
  onSave: (value: string) => void | Promise<void>
  className?: string
  /** 追加到 textarea，例如与外层 flex 联用：`min-h-0 flex-1` */
  textareaClassName?: string
  saveLabel?: string
}

export function TextEditor({
  initialValue,
  onSave,
  className,
  textareaClassName,
  saveLabel = "保存",
}: TextEditorProps) {
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )

  const handleSave = async () => {
    setStatus("saving")
    try {
      await onSave(value)
      setStatus("saved")
      setTimeout(() => {
        setStatus("idle")
      }, 2000)
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <textarea
        className={cn(
          "min-h-64 w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background",
          textareaClassName
        )}
        id="text-editor"
        onChange={(e) => {
          setValue(e.target.value)
        }}
        value={value}
      />
      <div className="flex shrink-0 items-center gap-2">
        <Button
          disabled={status === "saving"}
          onClick={handleSave}
          type="button"
          variant="default"
        >
          {status === "saving" ? "保存中…" : saveLabel}
        </Button>
        {status === "saved" ? (
          <span className="text-muted-foreground text-xs">已保存</span>
        ) : null}
        {status === "error" ? (
          <span className="text-destructive text-xs">保存失败</span>
        ) : null}
      </div>
    </div>
  )
}
