create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'swastik.kumar@aegis.edu.in';
$$;

create table if not exists public.contact_leads (
  id text primary key,
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  city text not null default '',
  message text not null default '',
  source text not null default 'contact_bot',
  preferred_language text not null default 'en',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_leads enable row level security;

drop trigger if exists set_contact_leads_updated_at on public.contact_leads;
create trigger set_contact_leads_updated_at
before update on public.contact_leads
for each row execute function public.set_updated_at();

drop policy if exists contact_leads_insert_public on public.contact_leads;
create policy contact_leads_insert_public on public.contact_leads
  for insert to anon, authenticated
  with check (true);

drop policy if exists contact_leads_select_admin on public.contact_leads;
create policy contact_leads_select_admin on public.contact_leads
  for select to authenticated
  using (public.is_admin());

drop policy if exists contact_leads_update_admin on public.contact_leads;
create policy contact_leads_update_admin on public.contact_leads
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists contact_leads_status_created_at_idx
  on public.contact_leads(status, created_at desc);
