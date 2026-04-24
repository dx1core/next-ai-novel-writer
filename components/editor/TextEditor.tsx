"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TextEditorProps = {
  initialValue: string
  onSave: (value: string) => void | Promise<void>
  label?: string
  className?: string
  saveLabel?: string
}

export function TextEditor({
  initialValue,
  onSave,
  label,
  className,
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
      {label ? (
        <label className="text-muted-foreground text-sm" htmlFor="text-editor">
          {label}
        </label>
      ) : null}
      <textarea
        className="min-h-64 w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background"
        id="text-editor"
        onChange={(e) => {
          setValue(e.target.value)
        }}
        value={value}
      />
      <div className="flex items-center gap-2">
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
