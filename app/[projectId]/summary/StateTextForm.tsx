"use client"

import { updateStateTextsAction } from "@/app/actions/profiles"
import { TextEditor } from "@/components/editor/TextEditor"

export function StateTextForm({
  projectId,
  which,
  initialValue,
}: {
  projectId: string
  which: "summary" | "character" | "plot"
  initialValue: string
}) {
  return (
    <TextEditor
      className="flex min-h-0 flex-1 flex-col gap-2"
      initialValue={initialValue}
      onSave={async (v) => {
        await updateStateTextsAction(projectId, which, v)
      }}
      textareaClassName="min-h-0 flex-1 resize-y overflow-y-auto"
    />
  )
}
