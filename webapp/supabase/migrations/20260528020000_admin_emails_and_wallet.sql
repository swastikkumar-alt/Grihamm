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

create table if not exists public.wallet_transactions (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  actor_uid uuid not null references auth.users(id) on delete restrict,
  amount integer not null check (amount > 0),
  transaction_type text not null default 'fund' check (transaction_type in ('fund', 'release', 'refund')),
  status text not null default 'recorded' check (status in ('recorded', 'pending', 'failed')),
  provider text not null default 'manual',
  provider_reference text,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_transactions enable row level security;

drop trigger if exists set_wallet_transactions_updated_at on public.wallet_transactions;
create trigger set_wallet_transactions_updated_at
before update on public.wallet_transactions
for each row execute function public.set_updated_at();

drop policy if exists wallet_transactions_select_related on public.wallet_transactions;
drop policy if exists wallet_transactions_update_admin on public.wallet_transactions;
create policy wallet_transactions_select_related on public.wallet_transactions
  for select to authenticated
  using (
    actor_uid = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.projects pr
      where pr.id = wallet_transactions.project_id
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
create policy wallet_transactions_update_admin on public.wallet_transactions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists projects_update_related on public.projects;
create policy projects_update_related on public.projects
  for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.professionals p
      where p.id in (projects.designer_id, projects.contractor_id)
        and p.partner_uid = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.professionals p
      where p.id in (projects.designer_id, projects.contractor_id)
        and p.partner_uid = auth.uid()
    )
  );

create or replace function public.record_wallet_funding(
  p_project_id text,
  p_amount integer,
  p_provider text default 'manual',
  p_provider_reference text default '',
  p_note text default ''
)
returns table(transaction_id text, escrow_amount integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_transaction_id text := upper('WAL-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12));
  v_escrow integer;
begin
  if v_actor is null then
    raise exception 'Authentication is required to fund a wallet.';
  end if;

  if coalesce(p_amount, 0) <= 0 then
    raise exception 'Funding amount must be greater than zero.';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project % was not found.', p_project_id;
  end if;

  if not (v_project.customer_uid = v_actor or public.is_admin()) then
    raise exception 'Only the project customer or an admin can fund this wallet.';
  end if;

  insert into public.wallet_transactions (
    id, project_id, actor_uid, amount, transaction_type, status, provider, provider_reference, note
  )
  values (
    v_transaction_id,
    p_project_id,
    v_actor,
    p_amount,
    'fund',
    'recorded',
    coalesce(nullif(trim(p_provider), ''), 'manual'),
    nullif(trim(p_provider_reference), ''),
    coalesce(p_note, '')
  );

  update public.projects
  set
    escrow_amount = coalesce(escrow_amount, 0) + p_amount,
    stage = case when coalesce(stage, '') in ('', 'Booking requested') then 'Escrow funded' else stage end,
    next_action = 'Wallet funding recorded. Grihamm operations will verify the payment reference before release.'
  where id = p_project_id
  returning public.projects.escrow_amount into v_escrow;

  return query select v_transaction_id, v_escrow;
end;
$$;

grant execute on function public.record_wallet_funding(text, integer, text, text, text) to authenticated;

create or replace function public.request_project_audit(
  p_project_id text,
  p_requested_by text,
  p_reason text,
  p_preferred_slot text default '',
  p_price integer default 999
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_audit_id text := upper('AUD-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12));
begin
  if v_actor is null then
    raise exception 'Authentication is required to request an audit.';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Audit reason is required.';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project % was not found.', p_project_id;
  end if;

  if not (v_project.customer_uid = v_actor or public.is_admin()) then
    raise exception 'Only the project customer or an admin can request an audit.';
  end if;

  insert into public.audit_requests (
    id, project_id, requested_by, reason, preferred_slot, price, status
  )
  values (
    v_audit_id,
    p_project_id,
    coalesce(nullif(trim(p_requested_by), ''), 'customer'),
    trim(p_reason),
    coalesce(p_preferred_slot, ''),
    coalesce(p_price, 999),
    'requested'
  );

  update public.projects
  set
    stage = 'Audit requested',
    next_action = 'Grihamm audit team to visit site. Audit fee: Rs ' || coalesce(p_price, 999) || '.'
  where id = p_project_id;

  return v_audit_id;
end;
$$;

grant execute on function public.request_project_audit(text, text, text, text, integer) to authenticated;
