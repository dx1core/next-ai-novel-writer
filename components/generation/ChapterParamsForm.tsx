"use client"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type ChapterParams = {
  charactersInvolved: string
  keyItems: string
  sceneLocation: string
  timeConstraint: string
  userGuidance: string
}

type ChapterParamsFormProps = {
  initial: Partial<ChapterParams>
  onChange: (p: ChapterParams) => void
}

export function ChapterParamsForm({
  initial,
  onChange,
}: ChapterParamsFormProps) {
  const uid = useId()
  const [state, setState] = useState<ChapterParams>({
    charactersInvolved: initial.charactersInvolved ?? "",
    keyItems: initial.keyItems ?? "",
    sceneLocation: initial.sceneLocation ?? "",
    timeConstraint: initial.timeConstraint ?? "",
    userGuidance: initial.userGuidance ?? "",
  })

  const patch = (patch: Partial<ChapterParams>) => {
    setState((s) => {
      const n = { ...s, ...patch }
      onChange(n)
      return n
    })
  }

  const id = (s: string) => `${uid}-${s}`

  return (
    <div className="notion-surface grid max-w-2xl gap-4 rounded-xl border border-border p-4 text-sm">
      <div className="flex flex-col gap-1.5">
        <Label
          className="font-medium text-[0.8125rem] text-muted-foreground"
          htmlFor={id("userGuidance")}
        >
          本章指导
        </Label>
        <Textarea
          className="min-h-24"
          id={id("userGuidance")}
          onChange={(e) => {
            patch({ userGuidance: e.target.value })
          }}
          value={state.userGuidance}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="font-medium text-[0.8125rem] text-muted-foreground"
          htmlFor={id("charactersInvolved")}
        >
          核心人物
        </Label>
        <Input
          id={id("charactersInvolved")}
          onChange={(e) => {
            patch({ charactersInvolved: e.target.value })
          }}
          value={state.charactersInvolved}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="font-medium text-[0.8125rem] text-muted-foreground"
          htmlFor={id("keyItems")}
        >
          关键道具
        </Label>
        <Input
          id={id("keyItems")}
          onChange={(e) => {
            patch({ keyItems: e.target.value })
          }}
          value={state.keyItems}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="font-medium text-[0.8125rem] text-muted-foreground"
          htmlFor={id("sceneLocation")}
        >
          场景地点
        </Label>
        <Input
          id={id("sceneLocation")}
          onChange={(e) => {
            patch({ sceneLocation: e.target.value })
          }}
          value={state.sceneLocation}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          className="font-medium text-[0.8125rem] text-muted-foreground"
          htmlFor={id("timeConstraint")}
        >
          时间压力
        </Label>
        <Input
          id={id("timeConstraint")}
          onChange={(e) => {
            patch({ timeConstraint: e.target.value })
          }}
          value={state.timeConstraint}
        />
      </div>
    </div>
  )
}
