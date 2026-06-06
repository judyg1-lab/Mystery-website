/*
  Warnings:

  - Added the required column `subtitle` to the `TarotCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TarotCard" ADD COLUMN     "subtitle" TEXT NOT NULL;
