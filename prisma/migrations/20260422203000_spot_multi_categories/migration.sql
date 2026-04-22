-- Multi-tag categories per spot (Postgres text[]).

ALTER TABLE "Spot" ADD COLUMN "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::text[];

UPDATE "Spot" SET "categories" = ARRAY["category"]::text[];

ALTER TABLE "Spot" DROP COLUMN "category";

DROP INDEX IF EXISTS "Spot_cityId_category_idx";
