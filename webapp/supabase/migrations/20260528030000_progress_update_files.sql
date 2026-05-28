alter table public.project_files
  add column if not exists update_id text references public.site_updates(id) on delete set null;

create index if not exists project_files_update_id_idx
  on public.project_files(update_id);

drop policy if exists professionals_select_listed_or_related on public.professionals;
create policy professionals_select_listed_or_related on public.professionals
  for select to anon, authenticated
  using (
    status = 'listed'
    or partner_uid = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.customer_uid = auth.uid()
        and professionals.id in (pr.designer_id, pr.contractor_id)
    )
  );
