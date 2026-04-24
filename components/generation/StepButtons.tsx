"use client"

import { Button } from "@/components/ui/button"

type StepButtonsProps = {
  onStep1: () => void
  onStep2: () => void
  onStep3: () => void
  onStep4: () => void
  busy: boolean
}

export function StepButtons({
  onStep1,
  onStep2,
  onStep3,
  onStep4,
  busy,
}: StepButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={busy}
        onClick={onStep1}
        type="button"
        variant="secondary"
      >
        Step1 生成架构
      </Button>
      <Button
        disabled={busy}
        onClick={onStep2}
        type="button"
        variant="secondary"
      >
        Step2 生成章节目录
      </Button>
      <Button disabled={busy} onClick={onStep3} type="button" variant="default">
        Step3 生成章节草稿
      </Button>
      <Button disabled={busy} onClick={onStep4} type="button" variant="default">
        Step4 定稿当前章
      </Button>
    </div>
  )
}
