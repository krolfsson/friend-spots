-- Use lowercase URL slug /rolfsson (redirects handle old /Rolfsson)
UPDATE "Room" SET "slug" = 'rolfsson' WHERE "slug" = 'Rolfsson';
