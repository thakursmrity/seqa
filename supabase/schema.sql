-- Run this once in Supabase: SQL Editor, paste, Run.
create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  sender_name text,
  type_id text,
  type_label text,
  sells text,
  buyer_ids text[] default '{}',
  stages text[] default '{}',
  sizes text[] default '{}',
  onboarded boolean default false,
  created_at timestamptz default now()
);

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  company_id text not null,
  status text not null default 'new',
  fit int,
  reason text,
  brief jsonb,
  contact_name text,
  contact_role text,
  contact_email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, company_id)
);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  prospect_id uuid not null references prospects on delete cascade,
  subject text,
  body text,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table prospects enable row level security;
alter table drafts enable row level security;

drop policy if exists "own profile" on profiles;
drop policy if exists "own prospects" on prospects;
drop policy if exists "own drafts" on drafts;
create policy "own profile" on profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own prospects" on prospects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own drafts" on drafts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
