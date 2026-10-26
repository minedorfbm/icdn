# Instagram photo galleries inside the destination sheets

Add a curated photo gallery to every place that has an Instagram account. The gallery lives only in the detail view (the full-screen sheet that opens when a card is tapped), never on the card itself.

## What the guest sees

When a guest taps a card and the detail sheet opens, below the description and details:

- A discreet gold label, e.g. `INSTAGRAM · @citron_danang`
- A horizontal strip of 3 to 6 photos, swipeable, with tall portrait crops and generous spacing — the same editorial language as the rest of the hub (no white Instagram frames, no rounded card grid)
- Tapping a photo opens it full screen, dark background, swipe left/right between photos, tap or swipe down to close
- Below the strip, the existing discreet Instagram button remains, opening the real account

Places with no Instagram account keep the sheet exactly as it is today.

## Where the photos come from

A new gallery table in the backend, so photos can be changed later without touching the design:

- One row per photo: which place it belongs to, the image, an optional caption, an optional direct link to the matching Instagram post, and a display order
- Publicly readable, like the existing content
- The app keeps a built-in fallback set, so the experience never appears empty if the backend is unreachable

For the first version I will seed each Instagram-enabled place with its existing hero image plus generated companion visuals in the resort's visual style, and mark clearly which are placeholders. Real Instagram photos should be supplied by the resort (a handful per venue) and I will swap them in.

## Scope

All places currently carrying an Instagram link: the restaurants and bars, plus Bensley and the wedding offer.

## Technical notes

- New table `public.destination_photos` (`id uuid`, `destination_id text` referencing `destinations`, `image_url text`, `caption text`, `post_url text`, `display_order int`, `active bool`), with `GRANT SELECT` to `anon`/`authenticated`, `GRANT ALL` to `service_role`, RLS enabled and a public read policy on `active = true`; writes stay admin-only, matching the existing tables.
- `getHubData` in `src/lib/hub.functions.ts` fetches photos in the same call and groups them by destination; `src/data/resort.ts` gains a `photos?: DestinationPhoto[]` field on `Destination`, the DB mapping, and a static fallback map.
- New `src/components/hub/InstagramStrip.tsx` (scroll-snap horizontal strip) and `src/components/hub/PhotoLightbox.tsx` (full-screen viewer with pointer swipe, reusing the gesture approach already in `CardStack.tsx`), rendered from `DestinationDetail.tsx` above the existing Instagram button.
- Captions and the section label go through the existing i18n dictionary keys so the four languages stay consistent; photo captions default to English when no translation exists.
- Images uploaded through `lovable-assets` so the repository stays light; `image_url` stores the CDN URL.
