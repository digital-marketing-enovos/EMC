# Cultural Compass

One leadership workshop, one session at a time, 10–20 participants on their phones.
Next.js (App Router) · TypeScript · Postgres · deployed on Vercel.
Typeface: DM Sans throughout, DM Mono for figures and coordinates.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | facilitator | Create a session. Prints the code and the facilitator key **once**. |
| `/s/[code]` | participant | The 12 trade-offs, then the personal result. |
| `/s/[code]/present` | facilitator | Projected join screen: QR code, join URL, live count. |
| `/s/[code]/results?k=[secret]` | facilitator | The debrief screen, full-screen matrix. A wrong or missing `k` is a 404. |
| `/admin?k=[ADMIN_KEY]` | facilitator | Edit the wording of the twelve items. |

## Local development

```bash
npm install
npm run dev
```

With no `DATABASE_URL`, the app runs on an in-memory store — fine for a rehearsal,
data is lost on restart. Production refuses to start without a database rather than
losing the workshop silently.

```bash
npm test          # scoring unit tests — run these before touching src/lib/scoring.ts
npm run build
npm run db:migrate                     # applies db/schema.sql
node scripts/seed.mjs --n 15 --burst   # 15 simultaneous submissions against a running server
```

## Deploying

1. Create a Postgres database (Neon or Supabase; any Postgres works).
2. Run the schema against it: `DATABASE_URL=... npm run db:migrate`.
3. Import the repo on Vercel and set `DATABASE_URL` in the project's environment variables.
4. Deploy, open `/`, create the session, and **bookmark the results link** — the key is
   in the URL and is not recoverable.

## On the day

1. Open `/`, create the session, keep that tab.
2. Project `/s/[code]/present`. The count updates every 3 seconds.
3. Open `/s/[code]/results?k=...` on the facilitator laptop. It opens on
   **Individual · Today** and polls every 3 seconds.
4. Drive the debrief with the two controls. `Aggregate` asks for confirmation the
   first time, on purpose — a centroid on a scattered cloud is an average, not a
   consensus.
5. `Close session` when the room is done. `Export CSV` for the raw responses.

## How scoring works

Each item belongs to axis X (collectivism ↔ individualism) or Y (integration ↔
fragmentation) and carries a `flip` flag meaning its **high pole is rendered on the
left**. A raw answer is the tapped position: `-3, -1, 1, 3`, no midpoint. Flipped items
are negated before aggregating; the mean of the six signed answers per axis maps to a
coordinate with `3 + (mean / 3) * 2`, giving `[1, 5]`. Today and tomorrow are scored
independently, server-side on submit — never on the phone.

Three of the six items on each axis are flipped, so answering everything with the same
button scores dead centre (3, 3). That is the anti-position-bias device working, and
`src/lib/__tests__/scoring.test.ts` asserts it.

Items are stored grouped by axis but rendered interleaved via `DISPLAY_ORDER` in
`src/lib/items.ts` — change it there and nowhere else.

## Editing the wording

`/admin?k=...` edits the title, the statement and the two propositions of each item.
Set `ADMIN_KEY` in the environment; without it there is no admin screen in production
(every request 404s), and local development falls back to `dev`.

Item ids, axis and `flip` are deliberately **not** editable: they decide which axis an
answer lands on and whether it is negated, so a typo there would silently rewrite every
coordinate, including those of responses already collected. `content.test.ts` asserts
that rewording all twelve items leaves the scores identical.

Each item carries a "Restore default" button, and there is one for all twelve.

## Where things live

```
src/lib/items.ts      the twelve items, DISPLAY_ORDER, the four worlds
src/lib/scoring.ts    signing, coordinates, validation, group statistics
src/lib/store.ts      data layer — Postgres, with an in-memory dev fallback
src/components/       Compass, AxisBar, ItemCard, PersonalResult, ResultsBoard
src/lib/content.ts    editable wording, merged over the code defaults
db/schema.sql         sessions, responses, item_texts
```
