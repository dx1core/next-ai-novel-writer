"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createProjectAction } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProjectForm() {
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  return (
    <form
      className="notion-surface flex max-w-md flex-col gap-3 rounded-xl border border-border/80 p-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        try {
          await createProjectAction({ name })
          setName("")
          router.refresh()
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="space-y-1.5">
        <Label
          className="font-medium text-[0.8125rem] text-foreground/90"
          htmlFor="new-project-name"
        >
          项目名称
        </Label>
        <Input
          id="new-project-name"
          onChange={(e) => {
            setName(e.target.value)
          }}
          placeholder="新建项目名称"
          required
          value={name}
        />
      </div>
      <Button className="w-fit" disabled={busy} type="submit">
        {busy ? "创建中…" : "创建项目"}
      </Button>
    </form>
  )
}
