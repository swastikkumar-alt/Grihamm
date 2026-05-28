create or replace function public.enforce_customer_contractor_booking()
returns trigger
language plpgsql
as $$
declare
  selected_type text;
  selected_status text;
begin
  if tg_op = 'UPDATE' then
    if old.contractor_id is distinct from new.contractor_id
      or old.designer_id is distinct from new.designer_id then
      raise exception 'Booked contractor cannot be changed after customer booking.';
    end if;

    return new;
  end if;

  if new.designer_id is not null then
    raise exception 'Customers can only book contractors.';
  end if;

  if new.contractor_id is null then
    raise exception 'Choose a contractor before creating a booking.';
  end if;

  if new.customer_uid is null or auth.uid() is null or new.customer_uid <> auth.uid() then
    raise exception 'Customers must create their own contractor bookings.';
  end if;

  select type, status
    into selected_type, selected_status
    from public.professionals
    where id = new.contractor_id;

  if selected_type is distinct from 'Contractor' or selected_status is distinct from 'listed' then
    raise exception 'Customers can only book listed contractors.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_customer_contractor_booking on public.projects;
create trigger enforce_customer_contractor_booking
before insert or update of contractor_id, designer_id on public.projects
for each row execute function public.enforce_customer_contractor_booking();
