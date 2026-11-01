# Budget — personal monthly budget manager

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · PostgreSQL · Prisma · Recharts · Lucide

## Run

1. Create a PostgreSQL database and set `DATABASE_URL` in `.env` (see `.env.example`).
   Quick local DB: `docker run -d --name budget-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=budget -p 5432:5432 postgres:16`
2. `npm install`
3. `npx prisma migrate dev --name init` (creates the tables)
4. `npm run dev` → http://localhost:3000

Production: `npm run db:deploy && npm run build && npm start`.

All data lives in PostgreSQL; theme and currency are stored in `AppSettings`. Nothing uses localStorage.
