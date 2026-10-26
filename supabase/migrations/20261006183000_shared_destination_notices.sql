begin;
-- Additional destinations share one notice and its translations. The primary
-- destination stays the editorial owner; no duplicate notice text is created.
create table if not exists public.destination_notice_links (
  notice_id text not null references public.destination_notices(id) on delete cascade,
  destination_id text not null references public.destinations(id) on delete cascade,
  primary key(notice_id,destination_id)
);
create index if not exists destination_notice_links_destination_idx
  on public.destination_notice_links(destination_id);
alter table public.destination_notice_links enable row level security;
revoke all on public.destination_notice_links from anon,authenticated;
grant select on public.destination_notice_links to anon,authenticated;
create policy "Published notice links for active destinations" on public.destination_notice_links
  for select to anon,authenticated using (
    exists(select 1 from public.destination_notices n where n.id=notice_id)
    and exists(select 1 from public.destinations d where d.id=destination_id and d.active)
  );
insert into public.destination_notice_links(notice_id,destination_id)
values('la-maison-heaven-refurbishment','wine-cellar')
on conflict(notice_id,destination_id) do nothing;
create or replace view public.published_destination_notices with (security_invoker=true) as
select n.id,targets.destination_id,n.kind,n.title,n.body,n.starts_at,n.ends_at,n.display_order,
  coalesce((select jsonb_agg(jsonb_build_object('locale',t.locale,'title',t.title,'body',t.body,
    'source_title',t.source_title,'source_body',t.source_body) order by t.locale)
    from public.destination_notice_translations t where t.notice_id=n.id and t.published), '[]'::jsonb) as translations
from public.destination_notices n
cross join lateral (
  select n.destination_id
  union
  select l.destination_id from public.destination_notice_links l where l.notice_id=n.id
) targets
join public.destinations d on d.id=targets.destination_id and d.active
where n.published and n.starts_at <= now() and (n.ends_at is null or n.ends_at > now());
commit;
