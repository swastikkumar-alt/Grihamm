create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  uid text primary key,
  display_name text,
  email text,
  photo_url text,
  role text not null default 'homeowner' check (role in ('homeowner', 'contractor', 'designer', 'admin')),
  phone_number text,
  active_project text,
  company_name text,
  occupation text,
  academy_enrolled boolean not null default false,
  profile_completed boolean not null default false,
  is_designer boolean not null default false,
  specialty text,
  experience text,
  consultation_fee text,
  project_fee text,
  bio text,
  education text,
  certifications text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id text primary key,
  name text not null,
  type text not null check (type in ('Interior Designer', 'Contractor')),
  city text not null,
  phone text not null,
  rating numeric not null default 0,
  review_count integer not null default 0,
  experience_years integer not null default 0,
  starting_price integer not null default 0,
  price_unit text not null default 'per project',
  services text[] not null default '{}',
  service_areas text[] not null default '{}',
  clients_served integer not null default 0,
  gstin text not null default '',
  grihamm_certified boolean not null default false,
  academy_credential text not null default '',
  portfolio_images text[] not null default '{}',
  bio text not null default '',
  status text not null default 'listed' check (status in ('listed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key,
  name text not null,
  type text not null check (type in ('Interior Designer', 'Contractor')),
  city text not null,
  phone text not null,
  experience text not null default '',
  completed_projects integer not null default 0,
  starting_price integer not null default 0,
  price_unit text not null default 'per project',
  payment_terms text not null default '',
  services text[] not null default '{}',
  service_areas text[] not null default '{}',
  clients_served integer not null default 0,
  gstin text not null default '',
  grihamm_certified boolean not null default false,
  academy_credential text not null default '',
  portfolio_images text[] not null default '{}',
  portfolio text not null default '',
  headline text not null default '',
  summary text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  customer_name text not null,
  city text not null,
  home_type text not null,
  scope text[] not null default '{}',
  budget integer not null default 0,
  stage text not null default 'planning',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  designer_id text references public.professionals(id) on delete set null,
  contractor_id text references public.professionals(id) on delete set null,
  escrow_amount integer not null default 0,
  next_action text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_updates (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  professional_id text not null references public.professionals(id) on delete cascade,
  title text not null,
  summary text not null default '',
  completed text[] not null default '{}',
  images text[] not null default '{}',
  next_step text not null default '',
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remarks (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  update_id text references public.site_updates(id) on delete set null,
  author_type text not null check (author_type in ('customer', 'partner', 'admin')),
  text text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_requests (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  requested_by text not null,
  reason text not null,
  preferred_slot text not null default '',
  price integer not null default 999,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_profiles',
    'professionals',
    'applications',
    'projects',
    'site_updates',
    'remarks',
    'audit_requests'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_read_public', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_public', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_public', table_name);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', table_name || '_read_public', table_name);
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (true)', table_name || '_insert_public', table_name);
    execute format('create policy %I on public.%I for update to anon, authenticated using (true) with check (true)', table_name || '_update_public', table_name);
  end loop;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_professionals_updated_at on public.professionals;
create trigger set_professionals_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_site_updates_updated_at on public.site_updates;
create trigger set_site_updates_updated_at
before update on public.site_updates
for each row execute function public.set_updated_at();

drop trigger if exists set_remarks_updated_at on public.remarks;
create trigger set_remarks_updated_at
before update on public.remarks
for each row execute function public.set_updated_at();

drop trigger if exists set_audit_requests_updated_at on public.audit_requests;
create trigger set_audit_requests_updated_at
before update on public.audit_requests
for each row execute function public.set_updated_at();

insert into public.professionals (
  id, name, type, city, phone, rating, review_count, experience_years,
  starting_price, price_unit, services, service_areas, clients_served,
  gstin, grihamm_certified, academy_credential, portfolio_images, bio, status
) values
  ('pro-design-blr', 'Grihamm Design Studio', 'Interior Designer', 'Bengaluru', '080-4567-1020', 4.9, 126, 8, 35000, 'per project', array['Space planning', '3D views', 'BOQ', 'Material selection', 'Office layout'], array['Whitefield', 'Indiranagar', 'CBD Bengaluru'], 64, '29AABCG1234K1Z8', true, 'Grihamm Academy Interior Execution Certificate', array['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=520'], 'Interior design team for homes, offices, clinics, and managed commercial fit-outs with BOQ and execution-ready drawings.', 'listed'),
  ('pro-design-pune', 'Studio Aakar Pune', 'Interior Designer', 'Pune', '020-4123-8890', 4.7, 88, 6, 25000, 'per project', array['Kitchen design', 'Wardrobes', 'Retail interiors', 'Office layout'], array['Baner', 'Wakad', 'Kharadi'], 41, '27AARCS4321B1Z5', false, '', array['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=520'], 'Design specialist for residential upgrades, small offices, retail units, and budget-aware modular interiors.', 'listed'),
  ('con-aswini', 'Aswini Civil Works', 'Contractor', 'Bengaluru', '8867683286', 4.8, 94, 11, 22000, 'per project', array['Civil work', 'Plumbing', 'Tiling prep', 'Commercial repair'], array['Whitefield', 'Marathahalli', 'Bellandur'], 73, '29AAJCA2399L1Z3', true, 'Grihamm Academy Site Quality Certificate', array['https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80&w=520'], 'Field-audited contractor for residential, office, and commercial civil changes, plumbing corrections, and site readiness.', 'listed'),
  ('con-rahul', 'Rahul Sharma Carpentry', 'Contractor', 'Bengaluru', '9663809667', 4.7, 83, 10, 950, 'per sqft', array['Carpentry', 'Modular kitchen', 'Wardrobes', 'Office storage'], array['Indiranagar', 'HSR Layout', 'Koramangala'], 58, '29ACVPR7781F1Z7', false, '', array['https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&q=80&w=520'], 'Carpentry contractor for homes, workplaces, modular storage, counters, TV units, and documented site progress.', 'listed'),
  ('con-anil', 'Anil Bhame Turnkey', 'Contractor', 'Pune', '9503865471', 4.8, 112, 14, 125000, 'per project', array['Turnkey execution', 'False ceiling', 'Paint', 'Office fit-out'], array['Baner', 'Wakad', 'Kharadi'], 96, '27AAFPB4512M1Z9', true, 'Grihamm Academy Turnkey Execution Certificate', array['https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&q=80&w=520'], 'Senior Pune contractor for homes, offices, showrooms, material coordination, and finishing handover.', 'listed'),
  ('pro-commercial-blr', 'Northline Commercial Interiors', 'Interior Designer', 'Bengaluru', '080-4120-7788', 4.8, 57, 9, 85000, 'per project', array['Office layout', 'Retail interiors', 'BOQ', 'Brand finishes'], array['MG Road', 'Indiranagar', 'Whitefield'], 38, '29AAFCN9932Q1Z2', true, 'Grihamm Academy Commercial Design Certificate', array['https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=520'], 'Commercial design team for offices, retail stores, studios, and customer-facing business spaces.', 'listed')
on conflict (id) do nothing;

insert into public.projects (
  id, customer_name, city, home_type, scope, budget, stage, progress,
  designer_id, contractor_id, escrow_amount, next_action
) values
  ('GR-1024', 'Meera Iyer', 'Bengaluru', 'Apartment renovation', array['Design', 'Civil work', 'Electrical', 'Carpentry'], 1240000, 'Carpentry in progress', 46, 'pro-design-blr', 'con-rahul', 180000, 'Review latest carpentry update and decide whether to approve the milestone.'),
  ('GR-1027', 'Patel Foods LLP', 'Pune', 'Retail outlet renovation', array['Civil work', 'Plumbing', 'Paint'], 2210000, 'Audit requested', 62, 'pro-design-pune', 'con-anil', 310000, 'Grihamm audit visit pending before next payout.'),
  ('GR-1031', 'Astra Labs Pvt Ltd', 'Bengaluru', 'Corporate office fit-out', array['Office layout', 'Electrical', 'False ceiling', 'Workstation carpentry'], 3860000, 'Execution drawings approved', 18, 'pro-commercial-blr', 'con-aswini', 420000, 'Assign execution calendar and collect first site update.')
on conflict (id) do nothing;

insert into public.site_updates (
  id, project_id, professional_id, title, summary, completed, images, next_step, status
) values
  ('upd-1024-1', 'GR-1024', 'con-rahul', 'Kitchen carcass installation', 'Base units are aligned and fixed. Shutter measurement is complete. Two hinges need replacement before final approval.', array['Base unit alignment', 'Carcass fixing', 'Hardware measurement'], array['https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&q=80&w=480'], 'Replace hinges and upload close-up photos.', 'review_needed'),
  ('upd-1027-1', 'GR-1027', 'con-anil', 'Civil wall correction', 'Bathroom wall correction is complete, but moisture marking is still visible at one corner.', array['Wall correction', 'Surface prep'], array['https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80&w=480'], 'Grihamm audit team visit required.', 'audit_requested')
on conflict (id) do nothing;

insert into public.remarks (
  id, project_id, update_id, author_type, text, status
) values
  ('rem-1024-1', 'GR-1024', 'upd-1024-1', 'customer', 'Please upload close-up photos of the hinge replacement before payout.', 'open'),
  ('rem-1027-1', 'GR-1027', 'upd-1027-1', 'admin', 'Audit required before releasing the next escrow milestone.', 'open')
on conflict (id) do nothing;
