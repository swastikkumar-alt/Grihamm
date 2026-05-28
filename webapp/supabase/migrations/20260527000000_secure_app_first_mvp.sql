create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admin_emails (email)
values ('swastik.kumar@aegis.edu.in')
on conflict (email) do nothing;

alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role <> 'homeowner' then
    new.role := 'homeowner';
  end if;

  if tg_op = 'UPDATE' and old.role <> new.role then
    new.role := old.role;
  end if;

  return new;
end;
$$;

alter table public.professionals
  add column if not exists partner_uid uuid references auth.users(id) on delete set null;

alter table public.applications
  add column if not exists applicant_uid uuid references auth.users(id) on delete set null;

alter table public.projects
  add column if not exists customer_uid uuid references auth.users(id) on delete set null;

create table if not exists public.project_files (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  bucket text not null default 'project-files',
  file_path text not null,
  file_name text not null,
  file_type text not null default 'application/octet-stream',
  file_size integer not null default 0,
  purpose text not null check (purpose in ('brief', 'progress', 'portfolio', 'audit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_files enable row level security;

drop trigger if exists prevent_user_profiles_role_escalation on public.user_profiles;
create trigger prevent_user_profiles_role_escalation
before insert or update on public.user_profiles
for each row execute function public.prevent_profile_role_escalation();

drop trigger if exists set_project_files_updated_at on public.project_files;
create trigger set_project_files_updated_at
before update on public.project_files
for each row execute function public.set_updated_at();

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
    'audit_requests',
    'project_files'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_read_public', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_public', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_public', table_name);
  end loop;
end;
$$;

drop policy if exists user_profiles_select_own_or_admin on public.user_profiles;
drop policy if exists user_profiles_insert_own on public.user_profiles;
drop policy if exists user_profiles_update_own_or_admin on public.user_profiles;
create policy user_profiles_select_own_or_admin on public.user_profiles
  for select to authenticated
  using (uid = auth.uid()::text or public.is_admin());
create policy user_profiles_insert_own on public.user_profiles
  for insert to authenticated
  with check (uid = auth.uid()::text and (role = 'homeowner' or public.is_admin()));
create policy user_profiles_update_own_or_admin on public.user_profiles
  for update to authenticated
  using (uid = auth.uid()::text or public.is_admin())
  with check (uid = auth.uid()::text or public.is_admin());

drop policy if exists professionals_select_listed_or_related on public.professionals;
drop policy if exists professionals_admin_insert on public.professionals;
drop policy if exists professionals_admin_update on public.professionals;
create policy professionals_select_listed_or_related on public.professionals
  for select to anon, authenticated
  using (status = 'listed' or partner_uid = auth.uid() or public.is_admin());
create policy professionals_admin_insert on public.professionals
  for insert to authenticated
  with check (public.is_admin());
create policy professionals_admin_update on public.professionals
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists applications_select_own_or_admin on public.applications;
drop policy if exists applications_insert_own on public.applications;
drop policy if exists applications_admin_update on public.applications;
create policy applications_select_own_or_admin on public.applications
  for select to authenticated
  using (applicant_uid = auth.uid() or public.is_admin());
create policy applications_insert_own on public.applications
  for insert to authenticated
  with check (applicant_uid = auth.uid());
create policy applications_admin_update on public.applications
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists projects_select_related on public.projects;
drop policy if exists projects_insert_customer on public.projects;
drop policy if exists projects_update_related on public.projects;
create policy projects_select_related on public.projects
  for select to authenticated
  using (
    customer_uid = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.professionals p
      where p.id in (projects.designer_id, projects.contractor_id)
        and p.partner_uid = auth.uid()
    )
  );
create policy projects_insert_customer on public.projects
  for insert to authenticated
  with check (customer_uid = auth.uid() or public.is_admin());
create policy projects_update_related on public.projects
  for update to authenticated
  using (
    customer_uid = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.professionals p
      where p.id in (projects.designer_id, projects.contractor_id)
        and p.partner_uid = auth.uid()
    )
  )
  with check (
    customer_uid = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.professionals p
      where p.id in (projects.designer_id, projects.contractor_id)
        and p.partner_uid = auth.uid()
    )
  );

drop policy if exists site_updates_select_related on public.site_updates;
drop policy if exists site_updates_insert_partner on public.site_updates;
drop policy if exists site_updates_admin_update on public.site_updates;
create policy site_updates_select_related on public.site_updates
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = site_updates.project_id
        and (
          pr.customer_uid = auth.uid()
          or exists (
            select 1 from public.professionals p
            where p.id in (pr.designer_id, pr.contractor_id)
              and p.partner_uid = auth.uid()
          )
        )
    )
  );
create policy site_updates_insert_partner on public.site_updates
  for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.professionals p
      join public.projects pr on pr.id = site_updates.project_id
      where p.id = site_updates.professional_id
        and p.partner_uid = auth.uid()
        and p.id in (pr.designer_id, pr.contractor_id)
    )
  );
create policy site_updates_admin_update on public.site_updates
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists remarks_select_related on public.remarks;
drop policy if exists remarks_insert_related on public.remarks;
drop policy if exists remarks_admin_update on public.remarks;
create policy remarks_select_related on public.remarks
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = remarks.project_id
        and (
          pr.customer_uid = auth.uid()
          or exists (
            select 1 from public.professionals p
            where p.id in (pr.designer_id, pr.contractor_id)
              and p.partner_uid = auth.uid()
          )
        )
    )
  );
create policy remarks_insert_related on public.remarks
  for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = remarks.project_id
        and (
          pr.customer_uid = auth.uid()
          or exists (
            select 1 from public.professionals p
            where p.id in (pr.designer_id, pr.contractor_id)
              and p.partner_uid = auth.uid()
          )
        )
    )
  );
create policy remarks_admin_update on public.remarks
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists audit_requests_select_related on public.audit_requests;
drop policy if exists audit_requests_insert_customer on public.audit_requests;
drop policy if exists audit_requests_update_related on public.audit_requests;
create policy audit_requests_select_related on public.audit_requests
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = audit_requests.project_id
        and (
          pr.customer_uid = auth.uid()
          or exists (
            select 1 from public.professionals p
            where p.id in (pr.designer_id, pr.contractor_id)
              and p.partner_uid = auth.uid()
          )
        )
    )
  );
create policy audit_requests_insert_customer on public.audit_requests
  for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = audit_requests.project_id
        and pr.customer_uid = auth.uid()
    )
  );
create policy audit_requests_update_related on public.audit_requests
  for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = audit_requests.project_id
        and pr.customer_uid = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = audit_requests.project_id
        and pr.customer_uid = auth.uid()
    )
  );

drop policy if exists project_files_select_related on public.project_files;
drop policy if exists project_files_insert_owner on public.project_files;
drop policy if exists project_files_update_admin on public.project_files;
create policy project_files_select_related on public.project_files
  for select to authenticated
  using (
    owner_uid = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = project_files.project_id
        and (
          pr.customer_uid = auth.uid()
          or exists (
            select 1 from public.professionals p
            where p.id in (pr.designer_id, pr.contractor_id)
              and p.partner_uid = auth.uid()
          )
        )
    )
  );
create policy project_files_insert_owner on public.project_files
  for insert to authenticated
  with check (owner_uid = auth.uid());
create policy project_files_update_admin on public.project_files
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists project_files_storage_select on storage.objects;
drop policy if exists project_files_storage_insert on storage.objects;
drop policy if exists project_files_storage_update on storage.objects;
create policy project_files_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-files'
    and (
      owner = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.project_files pf
        where pf.bucket = storage.objects.bucket_id
          and pf.file_path = storage.objects.name
          and (
            pf.owner_uid = auth.uid()
            or exists (
              select 1 from public.projects pr
              where pr.id = pf.project_id
                and pr.customer_uid = auth.uid()
            )
          )
      )
    )
  );
create policy project_files_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-files' and owner = auth.uid());
create policy project_files_storage_update on storage.objects
  for update to authenticated
  using (bucket_id = 'project-files' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'project-files' and (owner = auth.uid() or public.is_admin()));
