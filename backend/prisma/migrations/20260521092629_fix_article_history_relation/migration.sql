/*
  Warnings:

  - You are about to drop the column `category` on the `Favorite` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Favorite` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Favorite` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Favorite` table. All the data in the column will be lost.
  - You are about to drop the `TarotArticle` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,articleId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,historyId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ArticleTabType" AS ENUM ('ORIGINS', 'CODEX', 'REPORT');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('MYTHOLOGY', 'HISTORY', 'SOUL', 'DIVINATION');

-- CreateEnum
CREATE TYPE "SystemType" AS ENUM ('TAROT', 'ASTROLOGY', 'BAZI', 'ZIWEI');

-- AlterTable
ALTER TABLE "Favorite" DROP COLUMN "category",
DROP COLUMN "content",
DROP COLUMN "date",
DROP COLUMN "title",
ADD COLUMN     "articleId" INTEGER,
ADD COLUMN     "historyId" INTEGER;

-- DropTable
DROP TABLE "TarotArticle";

-- DropEnum
DROP TYPE "Category";

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "systemType" "SystemType" NOT NULL,
    "tabType" "ArticleTabType" NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "systemType" "SystemType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_title_key" ON "Article"("title");

-- CreateIndex
CREATE INDEX "Article_systemType_tabType_idx" ON "Article"("systemType", "tabType");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_articleId_key" ON "Favorite"("userId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_historyId_key" ON "Favorite"("userId", "historyId");

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE SET NULL ON UPDATE CASCADE;
