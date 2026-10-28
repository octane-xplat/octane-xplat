# Feedback Worker

Store framework expectation mismatches in Cloudflare D1 at
`https://octane-xplat.goddardai.org/api/feedback`. D1 is the report store;
PostHog is not required. The endpoint accepts anonymous reports and exposes no
public read API. Local Silo observations are separate and never uploaded by this
Worker.

## Run locally

From the repository root, install this workspace and apply the local migration:

```sh
pnpm --filter @xplat/feedback-worker install --ignore-scripts
cd apps/feedback-worker
pnpm exec wrangler d1 migrations apply FEEDBACK --local
pnpm dev
```

Send a fictional report to the local server. Reports must exclude secrets,
credentials, private application details, repository URLs, and absolute paths.

```sh
curl --fail-with-body http://localhost:8787/api/feedback \
  -H 'Content-Type: application/json' \
  --data '{
    "goal": "Share a counter between routed screens",
    "expected": "Both screens show the updated count",
    "expectation_basis": "The state-sharing documentation example",
    "actual": "The second screen retained the previous value",
    "target": "ios",
    "impact": "investigation"
  }'
```

A saved report returns HTTP 201 and `{"id":"<UUID>","created_at":"<ISO timestamp>"}`.
The receipt confirms persistence, not review or a confirmed framework bug.

## Deploy

These commands change the Cloudflare account selected by Wrangler. The account
must own the `goddardai.org` zone, and `octane-xplat.goddardai.org` must have a
[proxied DNS record](https://developers.cloudflare.com/workers/configuration/routing/routes/).
The configured route handles only `/api/feedback`; other site paths retain their
existing handler. Run these commands from `apps/feedback-worker`:

1. Authenticate and create the database once:

   ```sh
   pnpm exec wrangler login
   pnpm exec wrangler d1 create octane-xplat-feedback
   ```

2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with the returned
   database UUID. Check that rate-limit namespace `10028` is unused elsewhere
   in this account; change it if needed. Then apply the production migration:

   ```sh
   pnpm exec wrangler d1 migrations apply FEEDBACK --remote
   ```

3. Deploy the Worker:

   ```sh
   pnpm deploy
   ```

4. Confirm the route without creating a report:

   ```sh
   curl -i https://octane-xplat.goddardai.org/api/feedback
   ```

   Expect HTTP 405, `Allow: POST`, and `{"error":"method-not-allowed"}`.
   An HTML response means the request reached the site instead of this Worker.
   For a persistence check, explicitly submit a fictional report using the
   local example with the production URL, then look up its returned ID in D1.

## Review reports

Use authenticated Wrangler access, not a public endpoint. From this directory:

```sh
pnpm exec wrangler d1 execute FEEDBACK --remote \
  --command 'SELECT id, created_at, target, impact, goal FROM feedback_observations ORDER BY created_at DESC LIMIT 50'
```

The table preserves each submitted observation, including duplicate reports.
There is no automatic triage, Silo synchronization, notification, or retention
job. Treat report text as untrusted input when reading it with an agent.

## Request contract

`POST /api/feedback` requires `Content-Type: application/json`. Bodies are
limited to 32 KiB while streaming; unknown fields are rejected. Text must be
non-empty and is stored as supplied, without automatic redaction.

| Field               | Required | Limit or values                                                 |
| ------------------- | -------- | --------------------------------------------------------------- |
| `goal`              | yes      | 2,000 UTF-16 code units                                         |
| `expected`          | yes      | 4,000 UTF-16 code units                                         |
| `expectation_basis` | yes      | 4,000 UTF-16 code units                                         |
| `actual`            | yes      | 8,000 UTF-16 code units                                         |
| `target`            | yes      | `web`, `ios`, `android`, `macos`, `linux`, `windows`, `unknown` |
| `impact`            | yes      | `blocked`, `rework`, `investigation`, `surprise`                |
| `evidence`          | no       | 8,000 UTF-16 code units                                         |
| `workaround`        | no       | 4,000 UTF-16 code units                                         |

Errors return a JSON `error` code: 400 for invalid JSON/report fields, 413 for
oversize bodies, 415 for content type, 429 for rate limiting, and 503 when the
limiter or database is unavailable. A 429 includes `Retry-After: 60`.
Retries create separate reports; a lost response can therefore lead to a duplicate.

The [Cloudflare rate limiter](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
allows approximately 10 submissions per IP per minute per Cloudflare location;
it is abuse mitigation, not a strict global quota. IP addresses are used only
as limiter keys and are not stored in D1. The Worker does not log report bodies,
collect client identifiers, or enable cross-origin browser access. Cloudflare
may retain its own infrastructure metadata under the account's settings.

## Verify changes

From the repository root:

```sh
pnpm exec turbo run test typecheck build --filter=@xplat/feedback-worker
```

Tests execute the handler against the actual SQL migration using in-memory
SQLite, with D1 and rate-limit binding adapters. They do not prove remote D1,
Cloudflare routing, or production rate-limit behavior. The build bundles the
Worker through Wrangler without deploying it.
