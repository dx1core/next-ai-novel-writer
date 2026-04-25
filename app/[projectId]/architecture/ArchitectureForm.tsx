"use client"

import { updateArchitectureTextAction } from "@/app/actions/profiles"
import { TextEditor } from "@/components/editor/TextEditor"

export function ArchitectureForm({
  projectId,
  initialValue,
}: {
  projectId: string
  initialValue: string
}) {
  return (
    <TextEditor
      className="flex min-h-0 flex-1 flex-col gap-2"
      initialValue={initialValue}
      onSave={async (v) => {
        await updateArchitectureTextAction(projectId, v)
      }}
      textareaClassName="min-h-0 flex-1 resize-y overflow-y-auto"
    />
  )
}
