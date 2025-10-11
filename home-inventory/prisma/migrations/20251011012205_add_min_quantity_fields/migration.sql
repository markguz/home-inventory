-- AlterTable
ALTER TABLE "Category" ADD COLUMN "minQuantity" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "minQuantity" INTEGER;
