-- Key/value store mirroring the original window.storage API: one row per user + key.
-- Keys: "log:<day>:<date>", "nutrition:<date>", "weighins".
create table if not exists public.kv (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.kv enable row level security;

drop policy if exists "Users manage their own rows" on public.kv;
create policy "Users manage their own rows" on public.kv
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.kv to authenticated;
