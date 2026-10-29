# @xplat/ota-server

Serve phone JavaScript updates from a Cloudflare Worker and R2 bucket. Native
binaries receive only the channel pointer for their exact native fingerprint.
Start with the [phone update guide](../../docs/app/updates.md); the
[process contract](../../.agents/docs/notes/ota-process.md) owns recovery details.

## API and storage

| Route | Response |
| --- | --- |
| `GET /healthz` | `200 ok` |
| `GET /manifest?platform=ios&channel=stable&nativeFingerprint=<64-hex>&currentVersion=1.0.0` | A descriptor with `version`, `sha256`, `size`, `nativeFingerprint` and `url`; or an unavailable reason |
| `GET /bundles/<sha256>` | The immutable ZIP archive; `HEAD` returns headers only |

`nativeFingerprint` and `platform` are required. Missing channel/native cohort
returns `404 no-release`. Matching current version returns `up-to-date`;
a stored pointer with another identity returns `native-incompatible`.
Malformed requests return `400`, malformed stored pointers `502`.

```text
octane-xplat-ota-bundles/
  bundles/<sha256>
  channels/<channel>/<platform>/<nativeFingerprint>.json
```

The pointer contains `version`, `sha256`, `size`, `nativeFingerprint` and
`releasedAt`. Bundle upload precedes pointer upload. Publishing for a new
native fingerprint preserves pointers for existing binaries.

## Deploy (human step)

Configure your own Cloudflare account and bucket. This repository does not
deploy a service or discover credentials during framework installation.

```sh
cd tools/ota-server
pnpm wrangler login
pnpm wrangler r2 bucket create octane-xplat-ota-bundles
pnpm deploy
```

Use the deployed Worker's HTTPS origin in the app's update client. Deploy this
server version alongside fingerprint-enabled binaries. The former minimum
native version protocol has been removed; older binaries need their previous
endpoint contract until replaced.

## Publish a bundle

Build an OTA-enabled phone release first. Pass its prepared Vite `app/` output
and source app root, which contains `.xplat/fingerprints/<platform>.json`.
The script rejects debug payloads, missing build records and changed native
inputs. It reuses the actual build's recorded compiler context; publishing
does not require Xcode on the operator machine. Keep the source, build record
and payload from the same release job together.

```sh
cd tools/ota-server
pnpm publish:bundle -- --dir /path/to/built/app --project-dir /path/to/source-app \
  --platform ios --version 1.4.2 --channel staging --dry-run
```

The dry run prints the content address, cohort key and pointer JSON without
network writes. It needs `zip` on PATH. Remove `--dry-run` only for an intended
upload, with your own Wrangler authentication. Publish Android separately.
See [custom native inputs](../../packages/fingerprint/README.md#include-a-custom-native-input)
for generators outside automatic collection.

## Roll back a channel

Restore a saved pointer for the same native fingerprint. This stops new
installs of a bad release; installed devices rely on native boot recovery or
an app-requested rollback. It does not recall running code.

```sh
pnpm wrangler r2 object put \
  octane-xplat-ota-bundles/channels/stable/ios/NATIVE_FINGERPRINT.json \
  --file previous-pointer.json --content-type application/json
```

## Verify

Focused checks cover Worker routing and publisher dry runs without deployment.
Run them through Turbo from the repository root. Device cold-launch testing is
separate, as described in the phone update guide.

```sh
pnpm exec turbo run typecheck test --filter=@xplat/ota-server
```
