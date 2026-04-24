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
      initialValue={initialValue}
      label="Novel architecture（可编辑后保存）"
      onSave={async (v) => {
        await updateArchitectureTextAction(projectId, v)
      }}
    />
  )
}
