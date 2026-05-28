insert into public.professionals (
  id,
  partner_uid,
  name,
  type,
  city,
  phone,
  rating,
  review_count,
  experience_years,
  starting_price,
  price_unit,
  services,
  service_areas,
  clients_served,
  gstin,
  grihamm_certified,
  academy_credential,
  portfolio_images,
  bio,
  status,
  created_at
)
select
  case
    when applications.type = 'Interior Designer' then regexp_replace(applications.id, '^APP', 'PRO')
    else regexp_replace(applications.id, '^APP', 'CON')
  end as id,
  applications.applicant_uid,
  applications.name,
  applications.type,
  applications.city,
  applications.phone,
  0 as rating,
  0 as review_count,
  coalesce(nullif(substring(applications.experience from '([0-9]+)(?!.*[0-9])'), '')::integer, 0) as experience_years,
  applications.starting_price,
  applications.price_unit,
  applications.services,
  applications.service_areas,
  applications.clients_served,
  applications.gstin,
  applications.grihamm_certified,
  applications.academy_credential,
  applications.portfolio_images,
  coalesce(nullif(applications.summary, ''), applications.headline, ''),
  'listed' as status,
  now() as created_at
from public.applications
where applications.status = 'approved'
  and not exists (
    select 1
    from public.professionals
    where professionals.id = case
      when applications.type = 'Interior Designer' then regexp_replace(applications.id, '^APP', 'PRO')
      else regexp_replace(applications.id, '^APP', 'CON')
    end
  );
