/*
  Warnings:

  - You are about to drop the `SKU` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SKU" DROP CONSTRAINT "SKU_recipeId_fkey";

-- DropTable
DROP TABLE "SKU";

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "availableCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sku_name_key" ON "Sku"("name");

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
