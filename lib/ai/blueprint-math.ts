/** Port of `compute_chunk_size` / `limit_chapter_blueprint` from `blueprint.py`. */

export function computeChunkSize(
  numberOfChapters: number,
  maxTokens: number
): number {
  const tokensPerChapter = 200.0
  const ratio = maxTokens / tokensPerChapter
  const ratioRoundedTo10 = Math.floor(ratio / 10) * 10
  let chunkSize = ratioRoundedTo10 - 10
  if (chunkSize < 1) {
    chunkSize = 1
  }
  if (chunkSize > numberOfChapters) {
    chunkSize = numberOfChapters
  }
  return chunkSize
}

export function limitChapterBlueprint(
  blueprintText: string,
  limitChapters = 100
): string {
  const pattern = /(第\s*\d+\s*章[\s\S]*?)(?=第\s*\d+\s*章|$)/g
  const chapters = blueprintText.match(pattern) ?? []
  if (chapters.length <= limitChapters) {
    return blueprintText
  }
  return chapters
    .slice(-limitChapters)
    .map((chapter) => chapter.trim())
    .join("\n\n")
    .trim()
}
