"use client"

import { updateChapterTextAction } from "@/app/actions/profiles"
import { TextEditor } from "@/components/editor/TextEditor"

export function ChapterTextForm({
  projectId,
  chapterNumber,
  initialValue,
}: {
  projectId: string
  chapterNumber: number
  initialValue: string
}) {
  return (
    <TextEditor
      className="flex min-h-0 flex-1 flex-col gap-2"
      initialValue={initialValue}
      onSave={async (v) => {
        await updateChapterTextAction(projectId, chapterNumber, v)
      }}
      textareaClassName="min-h-0 flex-1 resize-y overflow-y-auto"
    />
  )
}
