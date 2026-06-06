-- CreateEnum
CREATE TYPE "TarotSuit" AS ENUM ('WANDS', 'CUPS', 'SWORDS', 'DISKS');

-- CreateTable
CREATE TABLE "TarotCard" (
    "id" SERIAL NOT NULL,
    "deck" TEXT NOT NULL DEFAULT 'THOTH_INSPIRED_MINOR',
    "suit" "TarotSuit" NOT NULL,
    "rank" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "backImageUrl" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "paletteNote" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarotCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TarotCard_slug_key" ON "TarotCard"("slug");

-- CreateIndex
CREATE INDEX "TarotCard_deck_orderIndex_idx" ON "TarotCard"("deck", "orderIndex");

-- CreateIndex
CREATE INDEX "TarotCard_suit_orderIndex_idx" ON "TarotCard"("suit", "orderIndex");
