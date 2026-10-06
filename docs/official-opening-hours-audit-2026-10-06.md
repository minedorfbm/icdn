# Official opening-hours audit — 6 October 2026

This is a source-backed editorial inventory for the Digital Hub, not a live timetable. Times are local to Danang (Asia/Ho_Chi_Minh). The machine-readable companion is [official-opening-hours-2026-10-06.csv](./official-opening-hours-2026-10-06.csv). In its `days` column, Monday is 1 and Sunday is 7.

## Integrated on 6 October 2026

16 service rows were integrated into `destination_opening_hours` across 10 destinations. The Saturday BBQ stays in the events model. The `confirmed` CSV rows cover Citron (four services), La Maison 1888, Tingara, Terra Mare (separate Saturday service), L_O_N_G Bar (food versus drinks), Mi Sol Spa, The Nail & Hair Studio, Planet Trekkers, Soar Gym and BENSLEY Outsider Gallery. Each row cites the current official page. These are opening/service hours, not a promise that a table, treatment, class or pool place is available without reservation.

## Do not publish a fixed time yet

- **Club InterContinental Lounge:** the [dedicated amenities page](https://www.danang.intercontinental.com/amenities/club-intercontinental/) gives afternoon tea 14:00–16:00 and cocktails 16:30–18:30, but other live pages on the same official site give 14:30–16:30 and 17:30–19:30. Confirm with the resort before displaying either set.
- **Pools:** the [official FAQ](https://www.danang.intercontinental.com/ko/sitemap/) states that infinity pools operate daily 06:00–19:00, but does not clearly assign that schedule to each of the hub's three pool cards. The [pool page](https://www.danang.intercontinental.com/recreation/swimming-pools/) names the pools without individual hours.
- **Sports Centre, water sports and beach games:** the [May 2026 activities PDF](https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Your-Guide-to-Fun-at-InterContinental-Danang.pdf) gives hours recorded as `dated_schedule` in the CSV. The [current recreation page](https://www.danang.intercontinental.com/recreation/) links a newer August 2026 schedule; that PDF could not be retrieved during this audit. The resort says activities may be suspended for weather or other reasons. These dated hours must be rechecked before publication.
- **Buffalo Bar:** its [official page](https://www.danang.intercontinental.com/dining/buffalo-bar/) says it is temporarily unavailable while La Maison 1888 undergoes refurbishment. Do not show an opening time or an “open now” indicator.
- **B Lounge, Nam Tram, conference centre, auditorium/cinema, M Club, organic garden, yoga pavilion, beaches, shops, private experiences and offers:** no reliable regular opening hours were found on their current official destination pages. Cinema screenings and culinary/nature classes are scheduled activities, not venue-wide hours. Show the current schedule or an enquiry link, not invented opening hours.

## Integration rules

Store the source URL, verification date and editorial status with every schedule. Display only `confirmed` rows in expanded cards. Keep timed events in the existing `destination_events` model instead of mixing them with venue opening hours. Do not auto-label a place “open now”: weather, renovations, private events and seasonal programmes can override published hours. A weekly check should flag changed source pages for human review before replacing the displayed times.
