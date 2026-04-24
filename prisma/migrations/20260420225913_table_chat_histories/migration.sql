-- CreateTable
CREATE TABLE "chat_histories" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "chat_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "tool_calls" JSONB,
    "tool_call_id" TEXT,
    "metadata" JSONB,
    "is_from_human" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_histories_chat_id_created_at_idx" ON "chat_histories"("chat_id", "created_at");
