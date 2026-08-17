-- CreateTable
CREATE TABLE "KudosType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KudosType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KudosTransaction" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "kudosTypeId" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KudosTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserKudosBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserKudosBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KudosType_code_key" ON "KudosType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserKudosBalance_userId_key" ON "UserKudosBalance"("userId");

-- AddForeignKey
ALTER TABLE "KudosTransaction" ADD CONSTRAINT "KudosTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosTransaction" ADD CONSTRAINT "KudosTransaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosTransaction" ADD CONSTRAINT "KudosTransaction_kudosTypeId_fkey" FOREIGN KEY ("kudosTypeId") REFERENCES "KudosType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKudosBalance" ADD CONSTRAINT "UserKudosBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
