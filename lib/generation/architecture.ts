import { getLlmAdapterWithFallback } from "@/lib/actions/project-llm"
import { formatTemplate } from "@/lib/ai/format-template"
import { invokeWithCleaning } from "@/lib/ai/invoke"
import {
  character_dynamics_prompt,
  core_seed_prompt,
  create_character_state_prompt,
  plot_architecture_prompt,
  world_building_prompt,
} from "@/lib/ai/prompt-generated"
import { prisma } from "@/lib/db"
import {
  clearArchitecturePartial,
  getNovelArchitecture,
  parsePartialJson,
  saveArchitecturePartial,
  setArchitectureContent,
} from "@/lib/db/architecture"
import { setCharacterStateContent } from "@/lib/db/state"
import type { PartialArchitectureData } from "@/lib/types"

export async function runArchitectureGeneration(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    throw new Error("项目不存在")
  }
  const archRow = await getNovelArchitecture(projectId)
  let partial: PartialArchitectureData = archRow?.partialJson
    ? parsePartialJson(archRow.partialJson)
    : {}
  const { adapter, config } = await getLlmAdapterWithFallback(
    projectId,
    "architecture"
  )
  const userGuidance = project.userGuidance ?? ""

  if (!partial.core_seed_result) {
    const prompt = formatTemplate(core_seed_prompt, {
      topic: project.topic,
      genre: project.genre,
      number_of_chapters: project.numChapters,
      word_number: project.wordNumber,
    })
    const out = await invokeWithCleaning(adapter, prompt)
    if (!out.trim()) {
      await saveArchitecturePartial(projectId, partial)
      throw new Error("核心种子生成失败")
    }
    partial = { ...partial, core_seed_result: out }
    await saveArchitecturePartial(projectId, partial)
  }

  if (!partial.character_dynamics_result) {
    const prompt = formatTemplate(character_dynamics_prompt, {
      user_guidance: userGuidance,
      core_seed: partial.core_seed_result ?? "",
    })
    const out = await invokeWithCleaning(adapter, prompt)
    if (!out.trim()) {
      await saveArchitecturePartial(projectId, partial)
      throw new Error("角色动力学生成失败")
    }
    partial = { ...partial, character_dynamics_result: out }
    await saveArchitecturePartial(projectId, partial)
  }

  if (partial.character_dynamics_result && !partial.character_state_result) {
    const prompt = formatTemplate(create_character_state_prompt, {
      character_dynamics: partial.character_dynamics_result.trim(),
    })
    const out = await invokeWithCleaning(adapter, prompt)
    if (out.trim()) {
      partial = { ...partial, character_state_result: out }
      await setCharacterStateContent(projectId, out)
      await saveArchitecturePartial(projectId, partial)
    }
  }

  if (!partial.world_building_result) {
    const prompt = formatTemplate(world_building_prompt, {
      user_guidance: userGuidance,
      core_seed: partial.core_seed_result ?? "",
    })
    const out = await invokeWithCleaning(adapter, prompt)
    if (!out.trim()) {
      await saveArchitecturePartial(projectId, partial)
      throw new Error("世界观生成失败")
    }
    partial = { ...partial, world_building_result: out }
    await saveArchitecturePartial(projectId, partial)
  }

  if (!partial.plot_arch_result) {
    const prompt = formatTemplate(plot_architecture_prompt, {
      user_guidance: userGuidance,
      core_seed: partial.core_seed_result ?? "",
      character_dynamics: partial.character_dynamics_result ?? "",
      world_building: partial.world_building_result ?? "",
    })
    const out = await invokeWithCleaning(adapter, prompt)
    if (!out.trim()) {
      await saveArchitecturePartial(projectId, partial)
      throw new Error("情节架构生成失败")
    }
    partial = { ...partial, plot_arch_result: out }
    await saveArchitecturePartial(projectId, partial)
  }

  const finalContent = [
    "#=== 0) 小说设定 ===",
    `主题：${project.topic},类型：${project.genre},篇幅：约${project.numChapters}章（每章${project.wordNumber}字）`,
    "",
    "#=== 1) 核心种子 ===",
    partial.core_seed_result ?? "",
    "",
    "#=== 2) 角色动力学 ===",
    partial.character_dynamics_result ?? "",
    "",
    "#=== 3) 世界观 ===",
    partial.world_building_result ?? "",
    "",
    "#=== 4) 三幕式情节架构 ===",
    partial.plot_arch_result ?? "",
  ].join("\n")

  await setArchitectureContent(projectId, finalContent)
  await clearArchitecturePartial(projectId)

  return { ok: true as const, model: config.modelName }
}
