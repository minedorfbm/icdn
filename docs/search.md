# Search vocabulary and moods

Search runs on the already loaded public catalogue, with no AI service, credentials,
extra request per keystroke or media loading. It searches names, short and expanded
descriptions, current translations, categories, levels, loaded events and curated
keywords. Only active destinations are searchable. The map additionally keeps only
`content_family = 'resort'`.

## Marketing maintenance

Edit **`destinations.search_keywords`**, a text array, independently from visible
copy. Migration `20261013003000_destination_search_keywords.sql` adds and seeds the
field for all 75 destinations, including hidden cards. It preserves existing
keywords and does not alter publication status. Apply it **before deploying** the
new catalogue reader.

Use the following shared concepts when appropriate:

- Food: `dining`, `japanese`, `french`, `vietnamese`, `italian`, `seafood`,
  `breakfast`, `tea`, `dinner`, `drinks`, `wine`.
- Mood: `relax`, `romantic`, `family`, `rain`, `active`, `nature`.
- Experiences: `spa`, `beauty`, `swim`, `beach`, `yoga`, `art`, `cooking`,
  `explore`, `transport`, `shopping`, `stay`, `celebration`, `meeting`, `photo`,
  `activity`.

The shared vocabulary in `src/features/search/search-intents.ts` recognizes these
concepts in English, Vietnamese, Russian, Chinese, Korean, Japanese and French,
independently of the interface language. Add free-form synonyms in any language to
the same field when a place needs a specific expression. New cross-language concepts
should be added to the shared vocabulary and covered by a query regression test.

Example: Tingara uses `dining`, `japanese`, `seafood`, `dinner`, `romantic`, `rain`,
`sake`, `teppanyaki`. Both “restaurant japonais” and “Japanese restaurant” find it.
“Restaurant romantique” combines requirements instead of showing every romantic
activity. Name matches rank first, followed by curated matches and descriptive text.
Accents, short prefixes and unambiguous single-edit typos are supported.

When a card has a keyword profile, that profile determines which shared concepts
it matches. Incidental wording in a title or description cannot add another mood
or activity. Cards without a profile fall back to their text. Ordinary words still
search the visible copy, and an exact destination name always remains searchable.

These are editorial suggestions, not guarantees of availability, opening status,
access eligibility, childcare or weather safety. Do not tag every `audience_tags =
['all']` card as family-friendly: `family` is curated around specific family uses.
`rain` denotes an indoor option, not a promise about the day's programme.

Unknown requirements and negation remain in the query. Search must not quietly turn
“restaurant sans gluten” into an unverified dietary recommendation. This is a
bounded synonym/intent matcher, not unrestricted natural-language understanding.
