"use client"

import { updateStateTextsAction } from "@/app/actions/profiles"
import { TextEditor } from "@/components/editor/TextEditor"

export function StateTextForm({
  projectId,
  which,
  label,
  initialValue,
}: {
  projectId: string
  which: "summary" | "character" | "plot"
  label: string
  initialValue: string
}) {
  return (
    <TextEditor
      initialValue={initialValue}
      label={label}
      onSave={async (v) => {
        await updateStateTextsAction(projectId, which, v)
      }}
    />
  )
}
