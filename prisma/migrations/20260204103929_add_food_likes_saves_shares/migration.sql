-- CreateTable
CREATE TABLE "FoodLike" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSave" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodShare" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodLike_foodId_userId_key" ON "FoodLike"("foodId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodSave_foodId_userId_key" ON "FoodSave"("foodId", "userId");

-- AddForeignKey
ALTER TABLE "FoodLike" ADD CONSTRAINT "FoodLike_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLike" ADD CONSTRAINT "FoodLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSave" ADD CONSTRAINT "FoodSave_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSave" ADD CONSTRAINT "FoodSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodShare" ADD CONSTRAINT "FoodShare_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodShare" ADD CONSTRAINT "FoodShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
