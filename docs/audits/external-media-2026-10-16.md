# External media reliability — 16 October 2026

The audit covered 488 unique URLs across 74 active cards: 112 Instagram posts, 27 YouTube videos, 28 PDFs, 14 remote images and 307 pages. HTTP/metadata checks do not certify video playback on physical devices. iPhone/Android device checks and the catalogue backup remain separate follow-ups.

## Instagram

Five unique publications remain visible in a signed-in Instagram session, but their official embeds return unavailable content outside the hub as well. The user subsequently supplied a logged-out screenshot of `DL9jFzytrOp` explicitly stating that the content is age-restricted and requires sign-in. This confirms the access restriction for that post. Alcohol is a plausible explanation, but the notice does not state its reason and the other four posts have not individually been confirmed as age-restricted. This is not evidence of deletion or a disabled account setting. Instagram still offers the Embed menu and version-14 captioned markup for the B Lounge post. Plain and captioned embed responses both fail for that post, while the replacement supplied by the user works in both forms.

The new optional `destination_posts.embed_mode` defaults to `embed`. Set `link` only on the six audited associations below, preserving their URL, active state and order. This is a reversible editorial fallback, not automatic provider-error detection. Return an association to `embed` after a successful recheck; the frontend does not poll Instagram.

| Card | Instagram shortcode |
| --- | --- |
| B Lounge | DGwwT3cCPE5 |
| Buffalo Bar | DL9jFzytrOp |
| La Maison 1888 | DdQWW42D91g |
| The Wine Cellar | DdQWW42D91g |
| The Wine Cellar | DFfKmy2O0Bt |
| The Wine Cellar | DMPkp9hM_nP |

Replace only La Maison's watersports association `Dc2etiKCC_C` with the user-approved `DTkauDdEt51`, keeping position 4. Preserve the old association inactive, its three other active destinations, and the existing Wine Cellar association to the replacement. Resolve by destination and shortcode, rejecting ambiguous matches. Re-running the migration must not duplicate posts.

The carousel now exposes only the current and next placeholders to Instagram's shared processing pass, then retains visited players. Disabled placeholders cannot be picked up by a neighbouring post's global process call. Existing caption sizing and current-slide height remain unchanged.

## YouTube

Destination videos now share the homepage film's bounded player lifecycle: load only after a tap, stop waiting after 20 seconds, show a manual retry and a direct YouTube link on failure. A late ready event or an autoplay refusal clears the blocking fallback. Closing the card destroys its player. No automatic retry loop is added.

## Catalogue links

- Things to Do DAILY_SCHEDULE: replace the missing Green Season PDF with `https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf`, currently linked from the official Recreation page. Refuse to overwrite a different newer URL.
- X: clear only the audited `https://x.com/ICdanang` setting, whose profile is unavailable. Preserve the key for a confirmed replacement.
- Keep the six IHG links whose pages work in Chrome despite automated 403 responses, and the working redirects.

## Release order

Apply the additive migration and record it in the Supabase migration ledger in the same transaction, then deploy the frontend through the PR. The old frontend ignores the new field until deployment. Older database responses remain accepted while rollout proceeds. Production before/after snapshots are retained locally with the audit evidence; they contain public catalogue data only.
