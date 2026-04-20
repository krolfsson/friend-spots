# friend-spots — Project context (quick warm start)

## What this is
Create a shareable “friends map” where a group can add tips (places) to a shared map and list. A room is accessed by a slug URL like `/<roomSlug>`. Access is “unlocked” via a PIN stored in a cookie.

## Key user flows
- **Create map**: `/` → create room (name optional) + PIN → navigates to `/<roomSlug>`
- **Open existing map**: `/` → enter `/<roomSlug>` → navigates to `/<roomSlug>`
- **Unlock map**: `/<roomSlug>` → PIN form → cookie (`ROOM_ACCESS_COOKIE`) → access granted
- **Use map**: browse cities/categories, add tips, share link, rename room (name only; slug stays)

## Routes (App Router)
- **Home**: `src/app/page.tsx`
- **Room**: `src/app/[roomSlug]/page.tsx`
- **API**
  - Create room: `src/app/api/rooms/route.ts`
  - Unlock room: `src/app/api/rooms/[slug]/unlock/route.ts`
  - Rename room (name only): `src/app/api/rooms/[slug]/name/route.ts`
  - Spots list/create: `src/app/api/spots/route.ts`
  - Plus a spot: `src/app/api/spots/plus/route.ts`
  - Edit spot: `src/app/api/spot-edit/route.ts`
  - Places autocomplete/details: `src/app/api/places/*`
  - Cities: `src/app/api/cities/route.ts`

## Main UI components
- **Create map form**: `src/components/CreateRoomLandingForm.tsx`
- **Open existing map form**: `src/components/OpenExistingRoomForm.tsx`
- **Main room UI**: `src/components/CityClient.tsx`
- **Map**: `src/components/SpotsMap.tsx`
- **Add new tip form**: `src/components/AddSpotForm.tsx`
- **Unlock form**: `src/components/UnlockRoomForm.tsx`

## Data / DB
- Prisma schema: `prisma/schema.prisma`
- Important note for Neon/PgBouncer:
  - Use pooled URL for `DATABASE_URL`
  - Use direct (non-pooled) URL for `DIRECT_URL` (migrations)

## Categories
- Defined in: `src/lib/categories.ts`

## Maps / sharing helpers
- Google Maps link helper: `src/lib/mapsUrl.ts`

## Environment variables (names only)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `DEFAULT_CITY_SLUG` (optional)

## Common commands
- Install: `npm ci`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npx next build`
- Encoding guard (NUL/UTF-16 detector): `npm run check:encoding`

## Gotchas / “why did this break?”
- If you ever see `Unexpected character '\0'`, a file was likely saved as UTF‑16.
  - Run `npm run check:encoding` and re-save offending files as UTF‑8.
  - Workflows also should stay UTF‑8 (`.github/workflows/*.yml`).

