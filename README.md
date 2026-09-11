# Training Log

Next.js (static export) + Supabase, deployed on Vercel.

## Setup

1. In the Supabase SQL Editor, run `supabase/schema.sql`.
2. Create the login under Authentication → Users → Add user (check "Auto Confirm User"), then turn off new user sign-ups.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key. Set the same two variables in the Vercel project.

## Develop

```
npm install
npm run dev
```
