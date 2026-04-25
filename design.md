# next-ai-novel-writer — 功能方案与架构设计

本文档在 **本仓库既有技术栈**（见 `package.json`、`AGENTS.md`）下，描述与 **AI_NovelGenerator**（Python 桌面版）能力对齐的 **完整产品方案** 与 **实现落点**，供后续迭代与评审使用。

---

## 1. 文档目的与范围

| 项目 | 说明 |
|------|------|
| **目标** | 在 Web 应用（Next.js）中提供「设定 → 目录 → 章节草稿 → 定稿 → 可选审校」全流程，并支持多 LLM 配置、Embedding 与长程上下文检索。 |
| **范围** | 功能与业务规则以参考项目为准；**实现语言为 TypeScript**，持久化以 **PostgreSQL + Prisma** 为权威来源（替代纯文本文件散落存储）。 |
| **非目标** | 本文不规定具体 UI 稿与逐 API 字段名；落地时以 `prisma/schema.prisma` 与 `app/actions` 实现为准。 |

---

## 2. 技术栈（本仓库约束）

| 领域 | 选型 | 说明 |
|------|------|------|
| 框架 | Next.js 16（App Router）、React 19 | 默认 Server Components；交互与表单用 Client 或 Server Actions。 |
| 语言 | TypeScript 5（strict） | 与 `AGENTS.md` 一致。 |
| UI | Tailwind CSS 4、shadcn/ui、Lucide | 与现有 `components/ui` 一致。 |
| 质量 | Biome | `pnpm lint` / `format`。 |
| 数据库 | PostgreSQL + Prisma 7 | 经 `@/lib/db` 单例（`@prisma/adapter-pg` + `pg`）；查询按领域拆到 `lib/db/*.ts`。 |
| 包管理 | pnpm | 新增依赖需与维护者约定。 |

**关于 AI 与检索（设计层约定，实现时选型需再确认）**

- **对话/补全**：通过 HTTP 调用 OpenAI 兼容接口或其它厂商；可在服务端用官方 SDK 或 **Vercel AI SDK** 等薄封装，抽象为 `lib/ai/llm.ts` 类「适配器工厂」，与参考项目的 `interface_format → 适配器」一致。
- **Embedding**：独立配置；与补全可不同厂商。
- **向量检索**：本仓库实现为 **PostgreSQL + pgvector**（`VectorEntry` 表，余弦距离索引；切块写入与检索在 `lib/rag`）。设计层保留 **「章块向量 + metadata（项目 ID、来源 chapter|knowledge）」** 概念即可。

---

## 3. 功能总览（与参考项目对齐）

### 3.1 核心流水线

1. **生成小说架构（Step 1）**  
   多阶段 LLM：核心种子 → 角色动力学 → 初始角色状态 → 世界观 → 三幕式情节；支持**断点续跑**（等价于 `partial_architecture.json`）。  
   **产出**：汇总的架构文档（结构化存库 + 可选全文导出）。

2. **生成章节目录 / 章节蓝图（Step 2）**  
   基于已生成架构，生成长篇 **章节目录**（每章含标题、定位、作用、悬念、伏笔、转折、简述等可解析字段）；支持**分块生成**与**从已有目录续写**（超长篇时控制单次 prompt 体积）。

3. **生成章节草稿（Step 3）**  
   按当前章号组装 prompt：读入架构、目录中本章与下一章信息、全局摘要、角色状态、近文摘录；非首章时含 **近章摘要 LLM**、**检索关键词 LLM**、**向量检索**、**检索结果再过滤（LLM）**；首章走单独模板。  
   **支持用户编辑提示词后再生成**（与参考 GUI 行为一致）。  
   **产出**：当前章正文草稿。

4. **定稿当前章（Step 4）**  
   用 LLM 更新 **全局摘要**、**角色状态**；将本章内容 **写入向量库**（切块策略与参考项目一致：长度切分、可选相似度合并等，实现时单独模块化）。  
   可选：**扩写**（字数不足时）。

### 3.2 配置与运行环境

- **多套 LLM 配置**（命名档案）：API Key、Base URL、`interface_format`、模型名、temperature、max_tokens、timeout。  
- **按步骤选择模型**（与参考 `choose_configs` 对齐）：  
  - 架构生成  
  - 章节目录生成  
  - 章节草稿生成（含中间摘要/检索/过滤若单配或跟主草稿模型）  
  - 定稿（摘要 + 角色状态）  
  - 一致性审校  
- **Embedding 配置**：独立 Key/URL/模型、`retrieval_k`。  
- **代理**：HTTP(S) 代理开关与地址（服务端发起外呼时需支持，实现方式由环境变量或请求级代理配置决定）。  
- **WebDAV / 同步**（可选）：配置项保留，用于备份或同步工作区；与参考项目一致为**可选能力**。

### 3.3 知识库

- **导入本地/上传文本**：分段后 **初始化或追加** 至向量库，与「章节定稿向量」共用同一检索集合时，需 **metadata 区分来源**（`source: chapter | knowledge`），避免检索逻辑混乱。  
- **检索规则**：对「近章重复」「历史章节距离」等可采用与参考项目类似的 **启发式标签**（如 `[SKIP]`、`[历史参考]`），再在 filters 中由 LLM 压缩为 `filtered_context`。

### 3.4 一致性审校（可选）

- 输入：小说设定（架构）、角色状态、全局摘要、最新章节正文、可选「剧情要点 / 未解决冲突」文本。  
- 输出：自然语言审校意见（LLM）。  
- 不强制阻塞定稿；作为**可选步骤**。

### 3.5 辅助与批量

- **批量生成章节**（若参考项目有）：顺序或限并发队列，每章仍走「草稿 → 定稿」或仅草稿，由产品开关决定。  
- **清空向量库**：按项目维度删除向量数据，更换 Embedding 模型前使用。  
- **查看剧情要点**：若业务上维护 `plot_arcs` 类文本，提供只读/编辑界面；与审校 prompt 联动。

### 3.6 项目与工作区

- 用户可管理**多个小说项目**（多本书），每项目独立：参数、架构、目录、章节、摘要、角色状态、向量 metadata。  
- **导出**：单项目导出为 ZIP（含文本与元数据）或仅 Markdown/TXT，便于离线编辑。

---

## 4. 架构设计（逻辑分层）

```
app/                    # 路由、页面、布局（Server Components 为主）
app/actions/            # Server Actions（"use server"）— 编排生成、定稿、审校
lib/
  db/                   # 按领域 Prisma 查询与事务（projects, chapters, settings, …）
  ai/                   # LLM 适配器、prompt 模板、invoke 封装、重试与清洗
  rag/                  # Embedding 适配器、向量库客户端、切块、检索、过滤管道
  parsers/              # 章节目录解析（等价 chapter_directory_parser）
config/                 # 默认配置、环境变量校验
```

- **不在 React 组件内** `new PrismaClient()`；统一 `import { prisma } from "@/lib/db"`。  
- **长时任务**：LLM 调用可能超时，评估使用 `after`、队列（如未来引入）或前端轮询任务状态；MVP 可用同步 Server Action + 适当 `maxDuration`（部署环境需支持）。

---

## 5. 数据模型（建议方向）

以下为 **设计级** 实体，落地时写入 `prisma/schema.prisma` 并迁移。

| 实体 | 职责 |
|------|------|
| `User` | 若以后多用户；单用户可省略或单例。 |
| `Project` | 小说项目；`topic`, `genre`, `numChapters`, `wordNumber`, `filepath` 置换为「工作目录标识」或「仅 DB」；存当前章号、创建时间等。 |
| `ProjectSettings` | 序列化或多列：选中的各步 LLM 档案 ID、Embedding 档案 ID、代理等。 |
| `LlmProfile` / `EmbeddingProfile` | 命名配置，加密或环境引用 API Key（**禁止明文写死**；生产用环境变量或密钥服务）。 |
| `NovelArchitecture` | Step1 成品与 `partial` 断点 JSON。 |
| `ChapterBlueprint` | 整份目录文本或规范化后的行表；解析缓存可存 JSON。 |
| `Chapter` | `number`, `draftContent`, `finalContent`, `status`（draft/final）, `updatedAt`。 |
| `GlobalSummary` | 一行或版本表。 |
| `CharacterState` | 当前快照或版本表。 |
| `PlotArcs` | 可选文本。 |
| `GenerationJob` | 可选：异步任务状态、错误信息、进度。 |

**向量数据**：使用 **pgvector** 存于 `VectorEntry`（`projectId`、`embeddingProfileId`、`source`、`content`、`vector(1536)`）。更换 Embedding 模型或维度前应 **按项目清空向量** 并重建；当前实现固定 **1536** 维以匹配常见 embedding 模型。

---

## 6. 核心业务流程（序列）

### 6.1 Step 1 — 架构生成

1. 校验项目与参数；读取或创建 `partial` 状态。  
2. 顺序调用各子 prompt，失败则持久化 `partial` 并返回可续跑信息。  
3. 成功后合并为单一架构正文，写入 `NovelArchitecture`，删除或归档 `partial`。  
4. 初始化 `CharacterState`（若未在子步骤中单独写入）。

### 6.2 Step 2 — 目录生成

1. 读取架构；若已有部分目录，解析已生成章数，从断点 **分块** 续写。  
2. `computeChunkSize` 类逻辑：按 `max_tokens` 估算每批章节数。  
3. 持久化完整 `Novel_directory` 等价物。

### 6.3 Step 3 — 章节草稿

1. 解析本章与下一章蓝图行。  
2. 首章：单模板，不拉「近三章摘要链」。  
3. 非首章：近文 → 摘要 LLM → 关键词 LLM → 向量检索 → 规则打标 → 过滤 LLM → 组装 `next_chapter_draft` 类 prompt。  
4. 若 UI 允许，返回可编辑 prompt，用户确认后再 **一次** 补全调用。  
5. 保存 `Chapter.draftContent`。

### 6.4 Step 4 — 定稿

1. 读取本章正文。  
2. 事务内：LLM 更新摘要、角色状态；更新 `Chapter` 为定稿；异步或同步 **向量入库**（失败策略：重试、记录告警、不阻塞文本定稿）。  
3. 可选扩写：在定稿前若 `wordCount < 目标`，调用扩写 LLM。

### 6.5 一致性审校

只读聚合 DB 中设定/状态/摘要/章节，调用审校 LLM，结果展示或存日志表。

---

## 7. 非功能需求

| 类别 | 要求 |
|------|------|
| 安全 | API Key 不进入客户端 bundle；Server Actions 校验会话与项目归属。 |
| 观测 | 服务端结构化日志（请求 id、项目 id、步骤、耗时）；错误信息对用户脱敏。 |
| 事务 | 定稿多表更新使用 Prisma `$transaction`。 |
| 兼容 | 保留「导出纯文本」以便与旧 Python 工作区文件互迁或人工 Git 管理。 |

---

## 8. 实现阶段建议

1. **MVP**：项目 CRUD + Step1/2/3/4 单线 + 单 LLM 配置 + PostgreSQL 存全文状态；向量可二期。  
2. **V1**：多 `LlmProfile`、按步选模型、Embedding + 检索链、知识库导入。  
3. **V1.5**：断点续跑、批量章节、一致性审校、代理。  
4. **V2**：异步任务队列、协作、更细版本历史。

---

## 9. 参考与差异说明

- **参考项目**：开源项目 [**AI_NovelGenerator**](https://github.com/YILING0013/AI_NovelGenerator)（Python + CustomTkinter + 文件态 + Chroma）。
- **本仓库差异**：**TypeScript + Next.js + Prisma/PostgreSQL** 为权威状态；向量存于 **pgvector**；文件导出为附属能力。  
- 参考项目中 README 曾描述 `outline_X.txt`、`plot_arcs` 自动更新等，与代码未必完全一致；本设计以 **能力意图** 为准，落地时以本仓库实现与测试为准。

---

## 10. 文档维护

- 功能变更时同步更新本文与 `AGENTS.md` / `README.md`。  
- 数据库结构变更仅通过 **Prisma migrate**，并在此文「数据模型」节更新摘要。
