-- CreateTable
CREATE TABLE "RoomVoterProfile" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "displayNameNorm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomVoterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomVoterProfile_roomId_voterKey_key" ON "RoomVoterProfile"("roomId", "voterKey");

-- CreateIndex
CREATE UNIQUE INDEX "RoomVoterProfile_roomId_displayNameNorm_key" ON "RoomVoterProfile"("roomId", "displayNameNorm");

-- CreateIndex
CREATE INDEX "RoomVoterProfile_roomId_idx" ON "RoomVoterProfile"("roomId");

-- AddForeignKey
ALTER TABLE "RoomVoterProfile" ADD CONSTRAINT "RoomVoterProfile_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
