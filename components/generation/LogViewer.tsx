"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type LogViewerProps = {
  lines: string[]
  className?: string
}

export function LogViewer({ lines, className }: LogViewerProps) {
  const ref = useRef<HTMLPreElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  })

  return (
    <pre
      className={cn(
        "notion-shadow-card max-h-64 min-h-32 overflow-y-auto rounded-lg border border-border bg-background p-3 font-mono text-[0.8125rem] text-foreground/90 leading-relaxed",
        className
      )}
      ref={ref}
    >
      {lines.length === 0 ? (
        <span className="text-muted-foreground">（暂无日志）</span>
      ) : null}
      {lines.map((l, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: log lines
        <span key={i}>
          {l}
          {"\n"}
        </span>
      ))}
    </pre>
  )
}
