# Instagram spots and Lobby

The Top 9 card keeps the official resort map’s A–I selection. Each item opens its published destination and displays a short, localized description beneath the image. The tenth section of the web article (culinary photography) is included in La Maison 1888’s description, not added as a separate spot.

| Map | Subcard                                      | Canonical destination            |
| --- | -------------------------------------------- | -------------------------------- |
| A   | The Reception Hall                           | `the-summit`                     |
| B   | Reception Lobby                              | `reception` (published as Lobby) |
| C   | Citron · Nón Lá Tables                       | `citron`                         |
| D   | La Maison 1888, including culinary creations | `la-maison-1888`                 |
| E   | Wall of Lanterns                             | `wall-of-lanterns`               |
| F   | Garden Pool · Jacuzzi                        | `garden-jacuzzi`                 |
| G   | The L_O_N_G Bar                              | `long-bar`                       |
| H   | The L_O_N_G Pool                             | `long-pool`                      |
| I   | Coconut Beach                                | `coconut-beach`                  |

English, Vietnamese, Russian, Chinese, Korean and Japanese are covered. Verified Discover alternates use `/vn/`, `/ru/`, `/zh/`, `/ko/` and `/ja/`. The official article body is currently English even on those localized routes; the hub summaries are translated independently. Wall of Lanterns remains from the official map/current catalogue, and the Jacuzzi summary is supported by the official pool page, since those two places are absent from the newer Top 10 article.

Sources checked 2026-10-18:

- [Official Instagram article](https://www.danang.intercontinental.com/top-instagrammable-spots/)
- [Official resort map](https://www.danang.intercontinental.com/wp-content/uploads/2025/12/InterContinental-Danang-Resort-Map.pdf)
- [Official pools](https://www.danang.intercontinental.com/recreation/swimming-pools/)
- [Resort design film](https://www.youtube.com/watch?v=pNOVYJjXN-c), whose verified title concerns Bill Bensley’s design, not a nine-stop tour.

## Data and rollout

Apply the three migrations in timestamp order, after uploading the two Lobby WebP images to `hub-images`. Collection copy is in `destination_collection_items`, loaded with card media rather than with the homepage. Anonymous/authenticated visitors have SELECT only; publication requires both parent and target cards to be active. Translation source matching prevents stale copy after editorial changes. Images always come from each target’s first card image.

Lobby reuses the existing `reception` ID and `lobby` map association at Heaven Level. The first selected photo is the preview, the second is the expanded cover. The obsolete contact-page placeholder Discover link is disabled. Description and existing section-heading translations are preserved or completed across all six UI languages.

Instagram import adds five CSV posts to the existing Top 9 post and two supplied Lobby posts. Existing associations retain their order and metadata. Shortcode/video-ID matching prevents duplicates across URL variants, including inactive associations. Unknown Instagram account names are left empty. The design film is associated with both cards. The carousel displays every published post with the existing lazy embed activation; pagination wraps if necessary.

The final content migration imports both cards' media through shared loops. The refactor was replayed against the original applied SQL in an isolated database and preserved the complete catalogue state, including IDs, ordering and timestamps. It requires no further production write.

No map geometry or other catalogue content is changed. The local before/after public snapshots verified all other cards, links, posts, videos, translations and map associations unchanged.

## Validation

- All migrations replayed in disposable PostgreSQL, including idempotent content replay, translation coverage, RLS and visitor write denial.
- Unit tests, types, lint, translation/image checks and production build/dry run.
- iPhone WebKit and Android Chromium: translated summaries, descriptions below subcards, destination navigation/back and access to the sixth Instagram post.
- Live storage files matched the selected optimized files by SHA-256.

Real Instagram/YouTube availability still depends on the external provider and visitor session/network.
