begin;

-- content_family is the editorial source of truth. The binary content_kind stays
-- compatible with deployed Workers during the rolling release, and is derived below.
alter table public.destinations
  add column content_family text not null default 'resort',
  add column audience_tags text[] not null default ARRAY['all']::text[],
  add column offer_duration text,
  add column offer_starts_on date,
  add column offer_ends_on date,
  add column storytelling_scope text,
  add column minimum_age smallint,
  add column maximum_age smallint;

update public.destinations
set content_family = case
  when id in ('destination-experiences','hoi-an-digital-tour','instagram-spots','nature-experiences','things-to-do') then 'storytelling'
  when id in ('culinary-activities','nguoi-dan-loi') then 'resort'
  when content_kind = 'offer' then 'offer'
  else 'resort'
end;
update public.destinations set
  offer_duration = case when content_family = 'offer' then
    case when id = 'enchanted-holiday' then 'limited' else 'ongoing' end else null end,
  storytelling_scope = case when content_family = 'storytelling' then
    case when id in ('hoi-an-digital-tour','destination-experiences') then 'destination' else 'resort' end else null end,
  audience_tags = case
    when type = 'kids' or id = 'kids-pool' then ARRAY['kids']::text[]
    when id in ('family-beach','family-pool','enchanted-holiday') then ARRAY['adult','kids']::text[]
    when type = 'bar' or id in ('mi-sol-spa','nail-hair','soar-gym') then ARRAY['adult']::text[]
    else ARRAY['all']::text[] end,
  minimum_age = case when id = 'mi-sol-spa' then 14 when id = 'nail-hair' then 16 else null end;
-- A limited offer may have a season/quota without verified calendar dates.
-- Do not invent booking dates or change publication status in this classification migration.

alter table public.destinations
  add constraint destinations_content_family_check check (content_family in ('resort','offer','storytelling')),
  add constraint destinations_audience_tags_check check (
    cardinality(audience_tags) between 1 and 2
    and audience_tags <@ ARRAY['adult','all','kids']::text[]
    and array_position(audience_tags,null) is null
    and cardinality(array_positions(audience_tags,'adult')) <= 1
    and cardinality(array_positions(audience_tags,'kids')) <= 1
    and cardinality(array_positions(audience_tags,'all')) <= 1
    and (not ('all' = any(audience_tags)) or cardinality(audience_tags) = 1)
  ),
  add constraint destinations_offer_fields_check check (
    (content_family = 'offer' and offer_duration is not null and offer_duration in ('limited','ongoing') and storytelling_scope is null
      and (offer_duration = 'limited' or (offer_starts_on is null and offer_ends_on is null)))
    or (content_family = 'resort' and offer_duration is null and offer_starts_on is null and offer_ends_on is null and storytelling_scope is null)
    or (content_family = 'storytelling' and storytelling_scope is not null and storytelling_scope in ('resort','destination')
      and offer_duration is null and offer_starts_on is null and offer_ends_on is null)
  ),
  add constraint destinations_offer_dates_check check (offer_starts_on is null or offer_ends_on is null or offer_starts_on <= offer_ends_on),
  add constraint destinations_ages_check check (
    (minimum_age is null or minimum_age between 0 and 120)
    and (maximum_age is null or maximum_age between 0 and 120)
    and (minimum_age is null or maximum_age is null or minimum_age <= maximum_age)
  );

create function public.sync_destination_legacy_kind()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.content_kind := case when new.content_family = 'resort' then 'place' else 'offer' end;
  return new;
end;
$$;
revoke all on function public.sync_destination_legacy_kind() from public;
create trigger destinations_sync_legacy_kind before insert or update on public.destinations
for each row execute function public.sync_destination_legacy_kind();
update public.destinations set content_kind = case when content_family = 'resort' then 'place' else 'offer' end;

-- Simple, automatically updatable views: one underlying row and WITH CHECK OPTION
-- prevent an edit in one workspace from silently moving a card into another family.
create view public.marketing_resort with (security_invoker = true) as
select id, name, content_family, cluster, type, level_id, audience_tags,
  minimum_age, maximum_age, short_description, image_key, detail_image_key,
  instagram_spot, display_order, active
from public.destinations where content_family = 'resort' with local check option;
create view public.marketing_offers with (security_invoker = true) as
select id, name, content_family, offer_duration, offer_starts_on, offer_ends_on,
  cluster, type, level_id, audience_tags, minimum_age, maximum_age,
  short_description, image_key, detail_image_key, display_order, active
from public.destinations where content_family = 'offer' with local check option;
create view public.marketing_storytelling with (security_invoker = true) as
select id, name, content_family, storytelling_scope, cluster, type, level_id,
  audience_tags, minimum_age, maximum_age, short_description, image_key,
  detail_image_key, instagram_spot, display_order, active
from public.destinations where content_family = 'storytelling' with local check option;

revoke all on public.marketing_resort, public.marketing_offers, public.marketing_storytelling from anon, authenticated;
grant select, insert, update, delete on public.marketing_resort, public.marketing_offers, public.marketing_storytelling to service_role;
-- No new user permissions: editing stays within the existing trusted admin access.

comment on column public.destinations.content_family is 'Editorial family: resort, offer, storytelling. Canonical classification used by hub and marketing views.';
comment on column public.destinations.content_kind is 'Legacy binary projection maintained by trigger for deployed Worker compatibility. Edit content_family instead.';
comment on column public.destinations.audience_tags is 'Editorial audience: all (alone), adult, kids or adult+kids. Kids Space will select explicit kids tags; not an admission rule.';
comment on column public.destinations.offer_duration is 'limited = season, quota or dates; ongoing = no scheduled end. Only for offers.';
comment on column public.destinations.offer_starts_on is 'Optional verified start date in Danang. Dates do not override manual active publication.';
comment on column public.destinations.offer_ends_on is 'Optional verified end date in Danang. No automatic expiry is enabled.';
comment on column public.destinations.storytelling_scope is 'Story subject: resort or destination. Only for storytelling.';
comment on column public.destinations.minimum_age is 'Verified minimum participant age, independent of editorial audience; null means not verified.';
comment on column public.destinations.maximum_age is 'Verified maximum participant age; null means not verified.';

commit;
