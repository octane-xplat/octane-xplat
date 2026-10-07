# @xplat/ota-server

Cloudflare Worker + R2 backend for Octane Xplat over-the-air JS bundle updates.
The client contract, payload format, and debugging runbook live in
[`docs/notes/ota-process.md`](../../docs/notes/ota-process.md).

## API

| Route | What it does |
| --- | --- |
| `GET /healthz` | `200 ok` liveness probe. |
| `GET /manifest?platform=ios\|android&channel=stable&nativeVersion=x.y.z&currentVersion=x.y.z` | Resolves the channel pointer to a payload descriptor: `version`, `sha256`, `size`, `minNativeVersion`, `url`. `updateAvailable: false` with `reason: up-to-date` or `min-native-version` when gated. `404 no-release` when the channel/platform has no pointer. |
| `GET /bundles/<sha256>` (`HEAD` too) | Streams the content-addressed zip payload, `Cache-Control: immutable`. |

## R2 layout

```
octane-xplat-ota-bundles/
  bundles/<sha256>                    # zip of the built vite app/ dir
  channels/<channel>/<platform>.json  # pointer: {version, sha256, size, minNativeVersion, releasedAt}
```

Bundles are keyed by content hash, so publishing is idempotent and a pointer
can only ever reference bytes that were already uploaded.

## Deploy (human step)

This package is deploy-ready but intentionally not deployed by automation —
Cloudflare credentials live on the operator's machine.

```sh
cd apps/ota-server
pnpm wrangler login                                   # one-time, opens cloudflare auth
pnpm wrangler r2 bucket create octane-xplat-ota-bundles  # one-time
pnpm deploy                                           # wrangler deploy
```

After deploy, the worker answers on `https://octane-xplat-ota.<account>.workers.dev`.
Point the app's OTA client at that origin (or attach a custom domain/route in
`wrangler.toml`).

## Publish a bundle

```sh
cd apps/ota-server
pnpm publish:bundle -- --dir <built-vite-app-dir> --platform ios \
	--version 1.4.2 --min-native 1.2.0 --channel stable
```

Add `--dry-run` to see the R2 keys and pointer JSON without uploading. The
script needs `zip` on PATH and the same wrangler credentials as deploy.

## Roll back a channel

Repoint the channel at an older bundle's pointer — the object is still in R2:

```sh
pnpm wrangler r2 object put \
	octane-xplat-ota-bundles/channels/stable/ios.json \
	--file <old-pointer.json> --content-type application/json
```

## Verify

```sh
pnpm typecheck   # tsc --noEmit against @cloudflare/workers-types
pnpm test        # node --test worker.test.mjs — handler logic with a mocked bucket
pnpm dev         # wrangler dev — local workerd instance, no deploy
```
