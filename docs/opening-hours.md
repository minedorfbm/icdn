# Opening hours

`destination_opening_hours` references `destinations.id`. One row describes one service and ISO weekdays (Monday=1); times are minutes since midnight in Danang, UTC+7. 0–1440 means 24-hour access. `last_order_minutes` is separate from closing time.

Only `published=true` rows on active destinations are public, through a SELECT-only RLS policy. Updates happen through Supabase administration; the public application cannot modify schedules. Unpublish a row before reviewing a disputed schedule, and update `source_url` and `verified_on` when rechecking it. No automatic “open now” status is inferred.

Hours load only when a card opens, alongside its media metadata, with a two-minute cache. A failed hours collection is retriable and never cached as a confirmed empty schedule. The UI uses six-language service labels and native weekday formatting; schedules themselves are stored once.

The migration seeds 16 reviewed service rows across 10 destinations. Terra Mare lunch is Thursday–Friday and separately Saturday; dinner excludes Saturday. Its Saturday BBQ remains an event rather than a duplicate opening-hours row. Pools, Club Lounge and dated activity timetables are not published as fixed hours. See the [source inventory](official-opening-hours-2026-10-06.csv) and [audit](official-opening-hours-audit-2026-10-06.md).
