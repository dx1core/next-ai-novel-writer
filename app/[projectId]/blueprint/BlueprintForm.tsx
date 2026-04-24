"use client"

import { updateBlueprintTextAction } from "@/app/actions/profiles"
import { TextEditor } from "@/components/editor/TextEditor"

export function BlueprintForm({
  projectId,
  initialValue,
}: {
  projectId: string
  initialValue: string
}) {
  return (
    <TextEditor
      initialValue={initialValue}
      label="章节目录 Novel_directory 风格"
      onSave={async (v) => {
        await updateBlueprintTextAction(projectId, v)
      }}
    />
  )
}
