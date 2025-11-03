-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "articleStatus" TEXT DEFAULT 'draft',
ADD COLUMN     "articleStatusPtBr" TEXT DEFAULT 'draft';
