alter table public.projects
  add column if not exists desired_start_date date,
  add column if not exists target_handover_date date,
  add column if not exists timeline_note text not null default '';

insert into public.professionals (
  id, name, type, city, phone, rating, review_count, experience_years,
  starting_price, price_unit, services, service_areas, clients_served,
  gstin, grihamm_certified, academy_credential, portfolio_images, bio, status
) values
  ('con-ajith-sharma-blr', 'Ajith Sharma Turnkey', 'Contractor', 'Bengaluru', '8147817457', 4.6, 42, 8, 0, 'quote after site review',
    array['Civil work', 'Plumbing', 'Carpentry', 'Modular kitchen', 'Electrical', 'False ceiling', 'Paint', 'Sofa / bedback'],
    array['Bengaluru'], 32, '', false, '', '{}',
    'Resource directory turnkey contractor covering civil, plumbing, carpentry, electrical, false ceiling, paint, and soft furnishing support.', 'listed'),
  ('con-arjun-sharma-blr', 'Arjun Sharma Turnkey', 'Contractor', 'Bengaluru', '8951403312', 4.6, 39, 8, 0, 'quote after site review',
    array['Civil work', 'Plumbing', 'Carpentry', 'Modular kitchen', 'Electrical', 'False ceiling', 'Paint', 'Sofa / bedback'],
    array['Bengaluru'], 29, '', false, '', '{}',
    'Resource directory turnkey contractor for residential and commercial execution packages.', 'listed'),
  ('con-takshit-blr', 'Takshit Turnkey Bengaluru', 'Contractor', 'Bengaluru', '7790867441', 4.5, 31, 7, 0, 'quote after site review',
    array['Civil work', 'Plumbing', 'Carpentry', 'Modular kitchen', 'Electrical', 'False ceiling', 'Paint', 'Sofa / bedback'],
    array['Bengaluru'], 24, '', false, '', '{}',
    'Resource directory turnkey contractor available for multi-trade execution requests in Bengaluru.', 'listed'),
  ('con-sukhdev-mahato-pune', 'Sukhdev Mahato Turnkey', 'Contractor', 'Pune', '9595374033', 4.5, 36, 9, 0, 'quote after site review',
    array['Civil work', 'Plumbing', 'Carpentry', 'Modular kitchen', 'Electrical', 'False ceiling', 'Paint', 'Sofa / bedback'],
    array['Pune'], 27, '', false, '', '{}',
    'Resource directory Pune turnkey contractor covering civil, modular, electrical, ceiling, paint, and sofa or bedback work.', 'listed'),
  ('con-badri-pune', 'Badri Turnkey', 'Contractor', 'Pune', '8180876064', 4.5, 34, 8, 0, 'quote after site review',
    array['Civil work', 'Plumbing', 'Carpentry', 'Modular kitchen', 'Electrical', 'False ceiling', 'Paint', 'Sofa / bedback'],
    array['Pune'], 26, '', false, '', '{}',
    'Resource directory Pune contractor for turnkey interior execution and finishing work.', 'listed'),
  ('con-takshit-pune', 'Takshit Turnkey Pune', 'Contractor', 'Pune', '7790867441', 4.5, 33, 7, 0, 'quote after site review',
    array['Civil work', 'Plumbing', 'Carpentry', 'Modular kitchen', 'Electrical', 'False ceiling', 'Paint', 'Sofa / bedback'],
    array['Pune'], 25, '', false, '', '{}',
    'Resource directory turnkey contractor available for Pune execution requests.', 'listed')
on conflict (id) do nothing;
