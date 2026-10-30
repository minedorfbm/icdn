# InterContinental Danang — Digital Discovery

Explore the resort. Find your next experience.

**Digital Discovery** connects Art Digital Journey’s QR-enabled artwork to the places, stories and experiences of InterContinental Danang. Guests scan a QR code and explore the resort in their browser, without installing an app or creating an account.

The experience follows four worlds — **Heaven → Sky → Earth → Sea** — bringing dining, wellness and activities into a shared journey. Guests can follow the levels, search for a place, explore the interactive map or let **Surprise me** choose their next discovery.

**[Open Digital Discovery](https://icdn.artdigitaljourney.com/)** · [Content guide](docs/database.md) · [Cloudflare operations](docs/cloudflare.md)

## The guest experience

Every published destination has a shareable page. Descriptions, opening hours, menus, photography, videos and reservation links are brought together according to the content available for that destination.

The journey, search and map open the same destination pages. Guests can move between discovery and practical information, read a menu, then return to their exploration. Supported resort pages and PDFs open in an in-app reader, with an option to open the original source in the browser.

The interface supports **English, Vietnamese, Russian, Simplified Chinese, Korean and Japanese**. Published editorial translations follow the same language selection.

## Find your starting point

| You want to…                                    | Start here                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Run or develop the application                  | [Local setup](#run-locally)                                                                |
| Update a place, experience or offer             | [Content maintenance](docs/database.md) · [Editorial taxonomy](docs/editorial-taxonomy.md) |
| Change translations or language-specific links  | [Translations](docs/translations.md) · [Localized links](docs/localized-links.md)          |
| Maintain images or map locations                | [Images](docs/images.md) · [Resort map](docs/resort-map.md)                                |
| Validate a change or investigate a failed check | [Validation](#validate-a-change) · [CI guide](docs/ci-validation.md)                       |
| Deploy or investigate production behaviour      | [Cloudflare guide](docs/cloudflare.md)                                                     |

## Run locally

Requirements: **Node.js 22.12+** and **Bun 1.4.2**.

```sh
git clone https://github.com/minedorfbm/icdn.git
cd icdn
bun install --frozen-lockfile --ignore-scripts
cp .env.example .env.local
```

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env.local` using the project you are authorized to read. Then start the development server:

```sh
bun run dev
```

Open the local URL printed by the server. The application reads published content from Supabase; local development requires a configured content source. The automated browser tests use their own local mock service.

`.env.local` is ignored by Git and does not change deployed Worker settings. Use only a publishable Supabase key for the application. Administrative secrets must remain outside the repository and the Worker configuration.

## How the project works

| Layer                                    | Responsibility                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React, TypeScript and TanStack Start** | Guest interface, navigation and server rendering. Vite and Nitro build the application.                                                                |
| **Cloudflare Workers**                   | Serves the application and static assets, reads public content on the server and caches eligible data and images.                                      |
| **Supabase**                             | Stores the published catalogue, editorial translations, destination relationships and media references. Public images live in the `hub-images` bucket. |

Supabase is the source of truth for editorial content. Public reads are controlled by row-level security; the application has no public content-writing access. Interface labels and presentation logic live in the codebase.

Useful entry points are `src/routes/` for pages, `src/components/hub/` for the discovery interface, `src/features/` for features such as the map and search, and `src/i18n/` for language handling. Tests live in `tests/` and `e2e/`.

## Maintain the experience

Content updates should preserve the links and references already used by guests:

- Keep destination IDs stable: direct links and QR codes depend on them.
- Review translations after editing their English source. Outdated translations fall back to current English; new copy is not translated automatically.
- Publish replacement images under new filenames, then update their references. Published image URLs are versioned for caching.
- Allow up to two minutes for public data caches to expire, then reload an already-open tab to check a publication.
- Check the current database state before applying migrations. Historical migrations must not be blindly replayed against production.

For specific tasks, use the guides for [opening hours](docs/opening-hours.md), [destination notices](docs/destination-notices.md), [expanded descriptions](docs/expanded-descriptions.md), [search](docs/search.md) and [database maintenance](docs/database.md).

## Validate a change

Use `bun run test` for unit tests during development. Before submitting a pull request, run the checks relevant to the change and review the required [Validate hub workflow](.github/workflows/ci.yml).

The browser suite covers **iPhone/WebKit** and **Android/Chromium**, both with the production build and a separate build that measures coverage. CI distributes these scenarios across isolated runners; [the CI guide](docs/ci-validation.md) explains the reports and failure traces.

<details>
<summary>Run the complete local code, data and browser checks</summary>

```sh
bun run security:audit
bun run migrations:check
bun run migrations:test
bun run i18n:check
bun run images:check
bun run test:coverage
bun run typecheck
bun run lint

# Install WebKit and Chromium once per development environment.
bun run test:mobile:install

# Validate the production build without deploying it.
bun run build
bun run deploy:check
bun run coverage:check-production
bun run test:mobile

# Build, test and report browser coverage separately.
bun run test:mobile:coverage
```

These commands cover the local code and browser checks. Optional SonarCloud analysis runs through the configured CI workflow.

</details>

Browser emulation should be complemented by checks on a physical phone, particularly for touch gestures and third-party media. Performance changes should be measured on the networks guests use, including Wi-Fi and mobile connections in Da Nang.

## Release and operate

Production runs on the Cloudflare Worker **`icdnd`**, connected to the repository’s `main` branch. Nitro produces `.output/server/wrangler.json` and `.output/public`; deployment includes the server-rendered application and its assets.

For a local preview of the built Worker:

```sh
bun run build
bun run preview:cloudflare
```

Follow the [Cloudflare guide](docs/cloudflare.md) for deployment, environment configuration, cache behaviour and production verification. It also documents the Smart Placement preview experiment and the measurements required before a production rollout.

The Art Digital Journey website at `artdigitaljourney.com` is maintained in a separate repository and Worker. This repository contains Digital Discovery for InterContinental Danang.

Contribute through a branch and pull request. The repository remains connected to Lovable; preserve published Git history as described in [AGENTS.md](AGENTS.md). The [original design brief](docs/design-brief.md) and [dated audits](docs/audits/) provide historical context and investigation records.
