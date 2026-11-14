# Demo data

Fills a Supabase project with Cebu City schools, their representatives and
sample students for demos. Everything it creates can be removed again.

| Script | What it does |
| --- | --- |
| `inspect.mjs` | Read-only summary of what's in the database. |
| `seed.mjs` | Creates the demo data (refuses to run if it already exists). |
| `cleanup.mjs` | Removes everything `seed.mjs` created, and nothing else. |

## Setup

Put the project's service-role key in `.env.seed` at the project root (it is
gitignored; never commit it or paste it anywhere):

```
SUPABASE_SERVICE_ROLE_KEY=...
```

Run each script from the project root (Node 24 or newer):

```
node --env-file=.env.local --env-file=.env.seed scripts/demo-seed/seed.mjs
```

## What gets created

- Five schools: University of San Carlos, Cebu Institute of Technology –
  University, University of Cebu, Cebu Normal University and University of the
  Philippines Cebu. Each has its logo, a page color theme, six programs and the
  standard requirements, one promotional post, and a saved message template.
  Programs come from each school's published list. Deadlines, slots and minimum
  averages are demo values; tuition is left blank.
- One representative per school (two for USC), and 18 fictional students with
  32 applications in every status: new, under review, resubmission requested,
  admitted, declined, held for batch release, and one draft.
- Sample documents (PDFs marked as demo samples), fit scores from the app's own
  scoring rules, conversations, post reactions and comments, and notifications.

Logos and campus photos are downloaded from Wikipedia and Wikimedia Commons when
the seed runs. The logos are the schools' trademarks; keep demos private.

Uploading a document starts the app's AI document check (Gemini), so uploads are
spaced a few seconds apart. Checks that hit a rate limit are retried by the
database every 15 minutes, so seed well before a demo.

## Accounts

All demo accounts use `demo.…@example.com` addresses and the password in
`DEMO_PASSWORD` (`data.mjs`). `seed.mjs` prints the full list when it finishes.
