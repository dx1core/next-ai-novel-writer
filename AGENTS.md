# AGENTS.md

面向在此仓库中工作的 **AI 编码助手** 的说明。详细约定以 [`.cursor/rules/`](.cursor/rules/) 下规则为准；本文件是入口摘要。

## 仓库定位

- **本仓库是通用项目模板**（可 fork / 复制后作为新应用起点），默认场景为 **AI 小说生成**（`next-ai-novel-writer`）。落地新项目时请：
  - 重命名包名、应用标题与品牌相关文案
  - 视需求调整 `prisma/schema.prisma` 与 `lib/db` 下的按领域拆分的查询
  - 保留 **PostgreSQL + Prisma 7** 时配置有效的 **`DATABASE_URL`**、**`@prisma/adapter-pg`** 与 `postinstall` 中的 `prisma generate` 约定
- 若将数据库换成其他引擎，需同步改 **Prisma schema、连接串、驱动适配器** 与 `lib/db.ts`，并更新本仓库文档。

## 技术栈

| 领域   | 选择 |
|--------|------|
| 框架   | Next.js 16（App Router）、React 19 |
| 语言   | TypeScript 5（`strict`） |
| 样式   | Tailwind CSS 4；组件上优先 **shadcn/ui**，其次 **Base UI**；图标用 **Lucide**（具名 import） |
| 数据库 | **PostgreSQL** + **Prisma 7**；RAG 向量存 **pgvector**（`VectorEntry`，1536 维）；运行时通过 `@prisma/adapter-pg`、`pg` 与 `lib/db.ts` 单例 |
| 包管理 | **pnpm** |

以本仓库的 `package.json` 和 `prisma/schema.prisma` 为权威；代码风格与静态检查统一由 **Biome**（`biome.json`）负责。

## 必须遵守的约定

### 数据库与 Prisma

- 仅通过 **Prisma Client** 访问数据；**不要**在 React 组件或 Server Action 里直接 `new PrismaClient` 或裸调 ORM。统一经 **`import { prisma } from "@/lib/db"`**，具体查询放在 **`lib/db/[feature].ts`**。
- 多步写入使用 **事务**；查询尽量带 **`select`**，避免过取字段。
- 模型与迁移只在 `prisma/schema.prisma` 与迁移流程中维护；**不要**手改已生成的 `prisma/migrations/` 历史。

### 依赖

- **新增依赖前须征得用户同意**（见 `general` 规则）。

### Next.js

- 默认 **Server Components**；仅在需要事件、部分 hooks、浏览器 API 时使用 **`"use client"`**。
- 数据获取：优先在 Server Component 中直接请求；可写 **Server Actions**（`app/actions/[feature].ts`，`"use server"`），避免多余的 API Route。
- 路由与导航用 **`next/navigation`**，不要用已废弃的 `next/router`。

### 代码形态（摘要）

- 避免 `any`；异步逻辑要有 **错误处理**（try/catch 或显式 Result）。
- 控制单函数/单文件/单组件体量（见 `code-structure`：如函数约 40 行内、单文件约 200 行等）：先写高层步骤，再拆小函数，用卫语句减嵌套。
- 除 Next 页面/布局的默认导出外，**优先具名导出**。

## 常用命令

```bash
pnpm dev          # 开发
pnpm build        # 生产构建
pnpm typecheck    # tsc
pnpm lint         # biome check
pnpm lint:fix     # biome check --write（含可自动修复项）
pnpm format       # biome format --write

pnpm db:generate  # prisma generate（postinstall 也会跑）
pnpm db:migrate   # prisma migrate dev
pnpm db:push      # prisma db push
pnpm db:studio    # Prisma Studio
```

从模板新建环境：先启动本机或容器中的 **PostgreSQL**，复制 **`.env.example`** 为 **`.env`**，将 **`DATABASE_URL`** 改为你的库连接串，再 `pnpm install` 与 `pnpm db:migrate`（或 `db:push` 于开发环境）。

## 路径别名

- 使用 `@/` 指向仓库根（见 `tsconfig.json` 的 `paths`）。

## 进一步阅读

| 主题 | 规则文件 |
|------|----------|
| 总览、命名、目录 | `general.mdc` |
| Next / React / TS | `nextjs.mdc` |
| Prisma / DB | `database.mdc` |
| 结构拆分与可读性 | `code-structure.mdc` |
| 质量与 import | `code-quality.mdc` |
| UI / Tailwind / 组件 | `ui.mdc` |
| 产品方案与架构 | `design.md` |

在实现功能前，若涉及多方案取舍或新架构，可先在对话中与用户对齐需求与设计。
