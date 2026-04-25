import { describe, expect, it, vi } from "vitest"

const { revalidatePath, buildChapterPromptText, runGenerateChapterDraft } =
  vi.hoisted(() => ({
    revalidatePath: vi.fn(),
    buildChapterPromptText: vi.fn(),
    runGenerateChapterDraft: vi.fn(),
  }))

vi.mock("next/cache", () => ({
  revalidatePath,
}))

vi.mock("@/lib/generation/chapter-prompt", () => ({
  buildChapterPromptText,
  runGenerateChapterDraft,
}))

import {
  buildChapterPromptAction,
  generateChapterDraftAction,
} from "@/app/actions/chapter"

describe("chapter actions", () => {
  const fields = {
    userGuidance: "聚焦冲突",
    charactersInvolved: "主角",
    keyItems: "古镜",
    sceneLocation: "皇城",
    timeConstraint: "夜晚",
  }

  it("returns success data for prompt building", async () => {
    buildChapterPromptText.mockResolvedValueOnce("prompt text")

    await expect(
      buildChapterPromptAction("project-1", 2, fields)
    ).resolves.toEqual({
      ok: true,
      prompt: "prompt text",
    })
  })

  it("returns a failure object for prompt building errors", async () => {
    buildChapterPromptText.mockRejectedValueOnce(new Error("prompt failed"))

    await expect(
      buildChapterPromptAction("project-1", 2, fields)
    ).resolves.toEqual({
      ok: false,
      error: "prompt failed",
    })
  })

  it("revalidates paths after a successful draft generation", async () => {
    runGenerateChapterDraft.mockResolvedValueOnce("chapter body")

    await expect(
      generateChapterDraftAction("project-1", 2, fields, null)
    ).resolves.toEqual({
      ok: true,
      text: "chapter body",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/project-1")
    expect(revalidatePath).toHaveBeenCalledWith("/project-1/chapters/2")
  })

  it("returns a failure object for draft generation errors", async () => {
    runGenerateChapterDraft.mockRejectedValueOnce(new Error("draft failed"))

    await expect(
      generateChapterDraftAction("project-1", 2, fields, null)
    ).resolves.toEqual({
      ok: false,
      error: "draft failed",
    })
  })
})
