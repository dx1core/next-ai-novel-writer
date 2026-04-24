import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex min-w-0 max-w-md flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">AI 小说生成</h1>
          <p>在此搭建章节、角色与生成流程；已接入 UI 与主题基础。</p>
          <p>示例按钮如下，可替换为业务操作入口。</p>
          <Button className="mt-2">示例按钮</Button>
        </div>
        <div className="font-mono text-muted-foreground text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}
