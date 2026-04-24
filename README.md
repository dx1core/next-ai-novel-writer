# AI 小说生成（next-ai-novel-writer）

基于 **Next.js 16**、**Prisma 7** 与 **PostgreSQL** 的 AI 小说生成应用模板，集成 shadcn/ui 与 Biome。

本地需可用的 PostgreSQL 实例，并在 `.env` 中配置 `DATABASE_URL`（见 `.env.example`）。首次拉库后执行 `pnpm db:migrate` 应用迁移。

## 开发

```bash
pnpm install
pnpm dev
```

更多约定与目录说明见 [AGENTS.md](./AGENTS.md)。

## 添加 shadcn 组件

```bash
pnpm dlx shadcn@latest add button
```

组件将出现在 `components/ui/` 中，使用方式：

```tsx
import { Button } from "@/components/ui/button"
```
