-- AlterTable
ALTER TABLE "City" ADD COLUMN "emoji" TEXT;

-- Kända städer: sätt flaggor (namn oberoende av versaler)
UPDATE "City" SET "emoji" = '🇩🇰' WHERE LOWER(TRIM("name")) IN ('köpenhamn', 'copenhagen');
UPDATE "City" SET "emoji" = '🇬🇧' WHERE LOWER(TRIM("name")) = 'london';
UPDATE "City" SET "emoji" = '🇺🇸' WHERE LOWER(TRIM("name")) IN ('new york', 'new york city');
UPDATE "City" SET "emoji" = '🇸🇪' WHERE LOWER(TRIM("name")) IN ('malmö', 'malmo', 'stockholm');
UPDATE "City" SET "emoji" = '🇯🇵' WHERE LOWER(TRIM("name")) IN ('tokyo', 'tokio');
