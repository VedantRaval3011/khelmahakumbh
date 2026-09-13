# Khel Mahakumbh — Surendranagar tournament manager

A Next.js app with full CRUD (people, teams, entries, matches, computed
earnings), backed by a Supabase Postgres database. Supabase's plain REST
client means no native binaries and no build-step database step — it just
works on Vercel.

## What's inside
- `app/page.js` — the whole UI (Dashboard, People, Teams, Entries, Matches, Earnings)
- `app/api/*` — REST routes for each entity (GET/POST/PUT/DELETE), talking to Supabase
- `db/schema.sql` — run this once in Supabase to create the tables
- `db/seed.cjs` — loads the confirmed participants already in your notes

## 1. Create a free Supabase project
1. Go to https://supabase.com → New project (free tier is plenty for this)
2. Once it's created, open **SQL Editor → New query**, paste the contents of
   `db/schema.sql`, and run it. That creates the four tables.
3. Go to **Project Settings → API**. You need two values:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role key** (not the `anon` key — this one has full access and
     must never be exposed to the browser, which is why it's only used
     inside the server-side API routes in this app) → this is
     `SUPABASE_SERVICE_ROLE_KEY`

## 2. Set up locally (optional, to test before deploying)
```bash
npm install
cp .env.example .env
# paste your real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY into .env
npm run db:seed      # loads the confirmed participants from your notes
npm run dev            # open http://localhost:3000
```

## 3. Push this project to GitHub
```bash
git init
git add .
git commit -m "Khel Mahakumbh tournament manager"
git branch -M main
git remote add origin https://github.com/<your-username>/khel-mahakumbh.git
git push -u origin main
```
(Create the empty repo on GitHub first if you haven't.)

## 4. Deploy on Vercel
1. Go to vercel.com → **Add New → Project** → import the GitHub repo you just pushed
2. Before the first deploy, open **Environment Variables** and add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Click **Deploy**

That's it — no build-time database step needed, since the tables already
exist in Supabase from step 1. Your live URL (e.g.
`khel-mahakumbh.vercel.app`) now has a working app with a real, persistent
database — every teammate you share the link with sees and can edit the
same live data.

If you haven't run `npm run db:seed` yet, you can also do it after
deploying — it just needs the same two env vars in your `.env` file locally.

## Notes on the data model
- **People** are the only "real" entities — never a person literally named
  "Himish + Jayshree Ben". Pairs are **Teams**, which just reference two
  people, so a person's singles, doubles, and mixed doubles participation
  all roll up correctly under their name.
- **Entries** link a person or team to a specific Location + Age group +
  Event, with a status: `CONFIRMED`, `TBD`, `OPEN` (empty slot), or `DUMMY`.
- **Matches** reference two entries and a winning entry, with an optional
  score and prize amount.
- **Earnings** are computed live from match wins — no separate table. A
  team's prize is split evenly between its two players.
- Men's events were intentionally left empty — the source notes said the
  handwriting for confirmed men's entries wasn't clear enough to seed
  safely. Add them in the People/Entries tabs once you have clean names.

## Security note
Row Level Security is left off on these tables (see `db/schema.sql`) because
every request goes through this app's own server-side API routes using the
service role key — the browser never talks to Supabase directly, so there's
nothing to lock down further for this app to function. If you later add a
public read-only view or a different client, revisit RLS at that point.
