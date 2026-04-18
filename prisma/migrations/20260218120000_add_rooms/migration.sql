-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");

-- Seed: /beta-2026 med pinkod 1234 (scrypt s1, fast salt — matchar src/lib/pin.ts)
INSERT INTO "Room" ("id", "slug", "pinHash", "name", "createdAt")
VALUES (
    'clroombeta20260001',
    'beta-2026',
    's1:a1b2c3d4e5f60718293a4b5c6d7e8f01:f6d13e54635de2dff8557a8f146d9c8ba25f03b13f56feb03334417b417df2c2',
    'Beta 2026',
    CURRENT_TIMESTAMP
);

-- AlterTable
ALTER TABLE "City" ADD COLUMN "roomId" TEXT;

UPDATE "City" SET "roomId" = 'clroombeta20260001' WHERE "roomId" IS NULL;

ALTER TABLE "City" ALTER COLUMN "roomId" SET NOT NULL;

DROP INDEX IF EXISTS "City_slug_key";

CREATE UNIQUE INDEX "City_roomId_slug_key" ON "City"("roomId", "slug");

ALTER TABLE "City" ADD CONSTRAINT "City_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
