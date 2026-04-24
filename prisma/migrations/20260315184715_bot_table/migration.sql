-- CreateTable
CREATE TABLE "bot" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "is_connected" BOOLEAN NOT NULL,
    "welcome_msg" TEXT,
    "out_of_turn_msg" TEXT,
    "response_time" INTEGER,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),

    CONSTRAINT "bot_pkey" PRIMARY KEY ("id")
);
