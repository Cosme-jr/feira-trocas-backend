/*
  Warnings:

  - You are about to alter the column `usuarioId` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(55)`.
  - You are about to alter the column `nome` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(55)`.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "usuarioId" SET DATA TYPE VARCHAR(55),
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(55);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
