-- Key/value store mirroring the original window.storage API.
-- Keys: "log:<day>:<date>", "nutrition:<date>", "weighins".
-- No login: anyone with the site's public key can read and write this table.
create table if not exists public.kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.kv enable row level security;

drop policy if exists "Public read/write" on public.kv;
create policy "Public read/write" on public.kv
  for all to anon
  using (true)
  with check (true);

grant select, insert, update, delete on public.kv to anon;
