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
      initialValue={initialValue}
      label={`第 ${chapterNumber} 章草稿`}
      onSave={async (v) => {
        await updateChapterTextAction(projectId, chapterNumber, v)
      }}
    />
  )
}
