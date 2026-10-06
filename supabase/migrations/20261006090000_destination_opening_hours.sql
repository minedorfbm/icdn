begin;

-- Weekly service hours, independently editable without changing destination descriptions.
create table if not exists public.destination_opening_hours (
  id text primary key,
  destination_id text not null references public.destinations(id) on delete cascade,
  service text not null check (service in ('opening','breakfast','lunch','afternoon_tea','dinner','drinks','food')),
  days smallint[] not null check (
    cardinality(days) between 1 and 7 and days <@ ARRAY[1,2,3,4,5,6,7]::smallint[]
    and array_position(days, null) is null
  ),
  opens_minutes smallint not null check (opens_minutes between 0 and 1439),
  closes_minutes smallint not null check (closes_minutes between 1 and 1440),
  last_order_minutes smallint,
  display_order integer not null default 0,
  source_url text not null check (source_url like 'https://www.danang.intercontinental.com/%'),
  verified_on date not null,
  published boolean not null default false,
  constraint service_time_range check (
    opens_minutes < closes_minutes and
    (last_order_minutes is null or last_order_minutes between opens_minutes and closes_minutes)
  ),
  constraint unique_service_days unique (destination_id, service, days)
);
create index if not exists destination_opening_hours_published_idx
  on public.destination_opening_hours(destination_id, display_order) where published;
alter table public.destination_opening_hours enable row level security;
revoke all on public.destination_opening_hours from anon, authenticated;
grant select on public.destination_opening_hours to anon, authenticated;
-- Only reviewed rows for published destinations can be read; clients cannot write.
create policy "Published destination hours" on public.destination_opening_hours
  for select to anon, authenticated using (
    published and exists (
      select 1 from public.destinations d where d.id = destination_id and d.active
    )
  );

insert into public.destination_opening_hours
  (id, destination_id, service, days, opens_minutes, closes_minutes,
   last_order_minutes, display_order, source_url, verified_on, published)
values
('citron-breakfast1234567', 'citron', 'breakfast', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 390, 630, null, 0, 'https://www.danang.intercontinental.com/dining/citron/', '2026-10-06', true),
('citron-lunch1234567', 'citron', 'lunch', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 720, 900, null, 1, 'https://www.danang.intercontinental.com/dining/citron/', '2026-10-06', true),
('citron-afternoon_tea1234567', 'citron', 'afternoon_tea', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 870, 990, null, 2, 'https://www.danang.intercontinental.com/dining/citron/', '2026-10-06', true),
('citron-dinner1234567', 'citron', 'dinner', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 1080, 1320, null, 3, 'https://www.danang.intercontinental.com/dining/citron/', '2026-10-06', true),
('la-maison-1888-dinner1234567', 'la-maison-1888', 'dinner', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 1110, 1260, 1245, 4, 'https://www.danang.intercontinental.com/dining/la-maison-1888/', '2026-10-06', true),
('tingara-dinner234567', 'tingara', 'dinner', ARRAY[2, 3, 4, 5, 6, 7]::smallint[], 1050, 1320, null, 5, 'https://www.danang.intercontinental.com/dining/tingara/', '2026-10-06', true),
('terra-mare-lunch45', 'terra-mare', 'lunch', ARRAY[4, 5]::smallint[], 720, 900, null, 6, 'https://www.danang.intercontinental.com/dining/terra-mare/', '2026-10-06', true),
('terra-mare-lunch6', 'terra-mare', 'lunch', ARRAY[6]::smallint[], 720, 840, null, 7, 'https://www.danang.intercontinental.com/dining/terra-mare/', '2026-10-06', true),
('terra-mare-dinner123457', 'terra-mare', 'dinner', ARRAY[1, 2, 3, 4, 5, 7]::smallint[], 1050, 1320, null, 8, 'https://www.danang.intercontinental.com/dining/terra-mare/', '2026-10-06', true),
('long-bar-drinks1234567', 'long-bar', 'drinks', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 600, 1380, null, 10, 'https://www.danang.intercontinental.com/dining/the-l_o_n_g-bar/', '2026-10-06', true),
('long-bar-food1234567', 'long-bar', 'food', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 690, 1320, null, 11, 'https://www.danang.intercontinental.com/dining/the-l_o_n_g-bar/', '2026-10-06', true),
('mi-sol-spa-opening1234567', 'mi-sol-spa', 'opening', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 600, 1320, null, 12, 'https://www.danang.intercontinental.com/spas/mi-sol-spa/', '2026-10-06', true),
('nail-hair-opening1234567', 'nail-hair', 'opening', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 540, 1080, null, 13, 'https://www.danang.intercontinental.com/spas/nail-and-hair-studio/', '2026-10-06', true),
('planet-trekkers-opening1234567', 'planet-trekkers', 'opening', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 540, 1080, null, 14, 'https://www.danang.intercontinental.com/recreation/planet-trekkers/', '2026-10-06', true),
('soar-gym-opening1234567', 'soar-gym', 'opening', ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[], 0, 1440, null, 15, 'https://www.danang.intercontinental.com/resort-information/', '2026-10-06', true),
('bensley-gallery-opening34567', 'bensley-gallery', 'opening', ARRAY[3, 4, 5, 6, 7]::smallint[], 480, 1020, null, 16, 'https://www.danang.intercontinental.com/amenities/bensley-outsider-gallery/', '2026-10-06', true)
on conflict (id) do nothing;

commit;
