-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "mediaUrl" DROP NOT NULL;
