# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File                     | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| `index.tsx`              | `/`                                                     |
| `about.tsx`              | `/about`                                                |
| `users/index.tsx`        | `/users`                                                |
| `users/$id.tsx`          | `/users/:id` (dynamic — bare `$`, no curly braces)      |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment)                  |
| `files/$.tsx`            | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx`            | layout route (renders children via `<Outlet />`)        |
| `__root.tsx`             | app shell — wraps every page; preserve `<Outlet />`     |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

The Discovery screens use `/surprise-me`, `/map` and `/search`. They support direct
entry and refresh without loading a destination or the home hero. Map links may
include `mode=explore|photos|walk|tour` and `placeId=<published-place-id>`. Closing a
screen returns to its source page and restores its context; a direct visit closes
to `/`. Card map links have a native URL fallback, including a safe `from=<card-id>`
return target, so they work even before hydration finishes.

All expanded destination routes share the focused card snapshot, primary photo
preload, deferred catalogue and nearby media loading. Citron is a test case for
that common path, not a separate implementation.
