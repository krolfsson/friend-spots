# friend-spots

Vanliga kompis-resetips per stad (Next.js, Prisma, Google Places).

## Varför `git push` kan kännas som inget händer

`git push` skickar bara till en **remote** (t.ex. `origin` på GitHub). Finns ingen remote, eller du har inte `git init` klart, ger kommandot inget meningsfullt resultat. Följ stegen nedan en gång.

## 1. GitHub-repo

### Alternativ A: GitHub i webbläsaren

1. Gå till [github.com/new](https://github.com/new), namn t.ex. `friend-spots`, skapa repot (tomt, utan README).
2. I Terminal:

```bash
cd ~/friend-spots
rm -rf .git
git init -b main
git add -A
git commit -m "Initial commit"
git remote add origin https://github.com/DITT-KONTO/friend-spots.git
git push -u origin main
```

(Byt `DITT-KONTO` och URL mot ditt konto. För SSH: `git@github.com:DITT-KONTO/friend-spots.git`.)

### Alternativ B: GitHub CLI (`gh`)

```bash
cd ~/friend-spots
rm -rf .git
git init -b main
git add -A
git commit -m "Initial commit"
gh repo create friend-spots --private --source=. --remote=origin --push
```

(`gh auth login` först om du inte redan är inloggad.)

## 2. Databas (Postgres) — krävs för Vercel

SQLite-filer fungerar inte tillförlitligt på Vercel. Appen använder **PostgreSQL**.

1. Skapa en gratis databas på t.ex. [Neon](https://neon.tech) (eller Supabase/Railway).
2. Kopiera **connection string** (börjar med `postgresql://` eller `postgres://`).
3. Uppdatera din lokala `.env`:

```env
DATABASE_URL="postgresql://...?sslmode=require"
DIRECT_URL="postgresql://...?sslmode=require"
GOOGLE_MAPS_API_KEY="din-nyckel"
```

På **Neon**: kopiera den **poolade** strängen till `DATABASE_URL` och den **direkta** (utan `-pooler` i värdnamnet) till `DIRECT_URL`. Utan `DIRECT_URL` kan `prisma migrate deploy` ge **P1002** (timeout på advisory lock) vid build.

(Ta bort gammal `file:./dev.db` om du hade SQLite förut. Du kan radera `dev.db` lokalt.)

4. Kör migrering mot den databasen:

```bash
cd ~/friend-spots
npx prisma migrate deploy
```

(Om du startar helt nytt Postgres-schema är tabellerna tomma; lägg till städer/tips igen via appen.)

## 3. Vercel

1. Logga in på [vercel.com](https://vercel.com) och **Add New Project**.
2. **Import** ditt GitHub-repo `friend-spots`.
3. Under **Environment Variables**, lägg minst:

   - `DATABASE_URL` — Neon **poolad** connection string (passar serverless).
   - `DIRECT_URL` — Neon **direkt** connection string (samma databas, utan pooler). Krävs så migreringar kan ta advisory lock; utan den riskerar Vercel-build **P1002**.
   - `GOOGLE_MAPS_API_KEY` — din Google Cloud-nyckel med Places API (New).

   Valfritt: `DEFAULT_CITY_SLUG` (slug som finns i databasen).

4. Deploy. Byggsteget kör `prisma migrate deploy && next build` så första deploy skapar tabeller automatiskt om databasen är tom.

### CLI (valfritt)

```bash
npm i -g vercel
cd ~/friend-spots
vercel login
vercel link
vercel env pull   # eller sätt variabler i Vercel-dashboard
vercel --prod
```

## Lokalt

```bash
npm install
# sätt DATABASE_URL, DIRECT_URL (samma som DATABASE om du inte använder pooler) + GOOGLE_MAPS_API_KEY i .env
npx prisma migrate deploy
npm run dev
```

Appen: [http://localhost:3002](http://localhost:3002) (port satt i `package.json`).

## Felsökning

- **Build faller på Prisma / DATABASE_URL**: Kontrollera att variabeln finns i Vercel *och* börjar med `postgresql://` eller `postgres://`.
- **P1002 / advisory lock / timeout vid `migrate deploy`**: Lägg till `DIRECT_URL` i Vercel (Neons **direkta** Postgres-URL, inte poolern). Sätt samma värde som `DATABASE_URL` i `.env.local` om du kör utan pooler lokalt.
- **Git hooks / Operation not permitted** (vissa miljöer): kör `git init` på din egen Mac-terminal i `~/friend-spots`, inte i sandlådor utan full filåtkomst.
