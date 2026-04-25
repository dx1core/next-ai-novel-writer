-- Enable pgvector (requires extension on the PostgreSQL instance)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "VectorEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "embeddingProfileId" TEXT,
    "source" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VectorEntry_projectId_idx" ON "VectorEntry"("projectId");

-- CreateIndex
CREATE INDEX "VectorEntry_embeddingProfileId_idx" ON "VectorEntry"("embeddingProfileId");

-- AddForeignKey
ALTER TABLE "VectorEntry" ADD CONSTRAINT "VectorEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VectorEntry" ADD CONSTRAINT "VectorEntry_embeddingProfileId_fkey" FOREIGN KEY ("embeddingProfileId") REFERENCES "EmbeddingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Approximate nearest neighbor index (cosine distance operator)
CREATE INDEX "VectorEntry_embedding_hnsw_idx" ON "VectorEntry" USING hnsw ("embedding" vector_cosine_ops);
