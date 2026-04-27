-- AlterTable: fanns i schema men saknade tidigare migration (P2022: column does not exist).
ALTER TABLE "City" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
