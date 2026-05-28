create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.user_profiles
  add column if not exists preferred_language text not null default 'en';

alter table public.user_profiles
  drop constraint if exists user_profiles_preferred_language_check;

alter table public.professionals
  add column if not exists partner_uid uuid references auth.users(id) on delete set null,
  add column if not exists business_address text not null default '',
  add column if not exists languages text[] not null default '{}',
  add column if not exists team_size integer not null default 0,
  add column if not exists monthly_capacity text not null default '',
  add column if not exists material_brands text[] not null default '{}',
  add column if not exists warranty_policy text not null default '',
  add column if not exists reference_projects text[] not null default '{}',
  add column if not exists insurance_coverage text not null default '';

alter table public.applications
  add column if not exists applicant_uid uuid references auth.users(id) on delete set null,
  add column if not exists business_address text not null default '',
  add column if not exists languages text[] not null default '{}',
  add column if not exists team_size integer not null default 0,
  add column if not exists monthly_capacity text not null default '',
  add column if not exists material_brands text[] not null default '{}',
  add column if not exists warranty_policy text not null default '',
  add column if not exists reference_projects text[] not null default '{}',
  add column if not exists insurance_coverage text not null default '';

alter table public.projects
  add column if not exists customer_uid uuid references auth.users(id) on delete set null,
  add column if not exists desired_start_date date,
  add column if not exists target_handover_date date,
  add column if not exists timeline_note text not null default '',
  add column if not exists project_type text not null default '',
  add column if not exists property_subtype text not null default '',
  add column if not exists area_type text not null default '',
  add column if not exists area_sqft integer not null default 0,
  add column if not exists budget_min integer not null default 0,
  add column if not exists budget_max integer not null default 0,
  add column if not exists requested_services text[] not null default '{}',
  add column if not exists site_address text not null default '',
  add column if not exists visit_preference text not null default '',
  add column if not exists preferred_language text not null default 'en',
  add column if not exists brief_notes text not null default '';

alter table public.projects
  drop constraint if exists projects_preferred_language_check;

create table if not exists public.translation_cache (
  cache_key text primary key,
  source_language text not null default 'en',
  target_language text not null,
  source_hash text not null,
  resources jsonb not null,
  provider text not null default 'google-translate-v2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.translation_cache enable row level security;

drop trigger if exists set_translation_cache_updated_at on public.translation_cache;
create trigger set_translation_cache_updated_at
before update on public.translation_cache
for each row execute function public.set_updated_at();

drop policy if exists translation_cache_read_public on public.translation_cache;
create policy translation_cache_read_public on public.translation_cache
  for select to anon, authenticated
  using (true);

create index if not exists translation_cache_target_language_idx
  on public.translation_cache(target_language);

create index if not exists professionals_status_city_idx
  on public.professionals(status, city);

create index if not exists projects_customer_uid_idx
  on public.projects(customer_uid);

create index if not exists professionals_services_gin_idx
  on public.professionals using gin(services);

create index if not exists projects_requested_services_gin_idx
  on public.projects using gin(requested_services);

create index if not exists projects_desired_start_date_idx
  on public.projects(desired_start_date);

create index if not exists projects_target_handover_date_idx
  on public.projects(target_handover_date);

update public.professionals
set
  languages = case
    when city = 'Bengaluru' and coalesce(cardinality(languages), 0) = 0 then array['English', 'Kannada', 'Hindi']
    when city = 'Pune' and coalesce(cardinality(languages), 0) = 0 then array['English', 'Marathi', 'Hindi']
    else languages
  end,
  team_size = case when team_size = 0 then greatest(4, least(24, experience_years + 4)) else team_size end,
  monthly_capacity = case when monthly_capacity = '' then 'Capacity reviewed during booking slot check' else monthly_capacity end,
  warranty_policy = case when warranty_policy = '' then 'Snag and workmanship support reviewed before milestone release' else warranty_policy end,
  business_address = case when business_address = '' then array_to_string(service_areas, ', ') else business_address end;

update public.projects
set
  project_type = case when project_type = '' then split_part(home_type, ' - ', 1) else project_type end,
  property_subtype = case when property_subtype = '' then coalesce(nullif(split_part(home_type, ' - ', 2), ''), home_type) else property_subtype end,
  requested_services = case when coalesce(cardinality(requested_services), 0) = 0 then scope else requested_services end,
  budget_min = case when budget_min = 0 then budget else budget_min end,
  budget_max = case when budget_max = 0 then budget else budget_max end;
