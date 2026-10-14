# Training Log

Next.js (static export) + Supabase, deployed on Vercel. There's no login: the site reads and writes one shared Supabase table with the public key.

## Setup

1. Apply the schema: `supabase link --project-ref <project-ref>`, then `supabase db push`. (Or paste the SQL from `supabase/migrations/` into the Supabase SQL Editor.)
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key. Set the same two variables in the Vercel project.

## Develop

```
npm install
npm run dev
```
