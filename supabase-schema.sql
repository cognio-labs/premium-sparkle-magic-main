create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamp with time zone default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  investment_amount numeric default 0,
  risk_profile text not null default 'moderate' check (risk_profile in ('conservative', 'moderate', 'aggressive')),
  returns_percent numeric default 0,
  website_status text not null default 'none' check (website_status in ('none', 'building', 'live')),
  created_at timestamp with time zone default now()
);

create table if not exists public.stocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  symbol text not null,
  company_name text not null,
  buy_price numeric not null default 0,
  current_price numeric not null default 0,
  quantity numeric not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  template_type text not null default 'portfolio' check (template_type in ('portfolio', 'business', 'landing', 'blog')),
  prompt_used text,
  generated_html text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  url_slug text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.stocks enable row level security;
alter table public.websites enable row level security;

drop policy if exists "profiles own data" on public.profiles;
create policy "profiles own data" on public.profiles
for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "clients own data" on public.clients;
create policy "clients own data" on public.clients
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "stocks own data" on public.stocks;
create policy "stocks own data" on public.stocks
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "websites own data" on public.websites;
create policy "websites own data" on public.websites
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists clients_user_id_created_at_idx on public.clients(user_id, created_at desc);
create index if not exists stocks_user_id_created_at_idx on public.stocks(user_id, created_at desc);
create index if not exists websites_user_id_status_idx on public.websites(user_id, status);
