# OTA update process

> The complete over-the-air update contract: how a NativeScript app boots a
> swapped JS bundle, what the server serves, and what to check when it breaks.
> Mechanism evidence lives in the [bundle-redirect gate](ota-updates.md);
> server source lives in [`apps/ota-server`](../../apps/ota-server).
>
> **Status: mechanism proven, thin infra shipped, client layer pending.**
> The boot redirect is verified on release-path builds on both platforms (gate
> record). This document plus `apps/ota-server` define the distribution side.
> What does *not* exist yet: a shipped `xplat`/app-side OTA client (download,
> verify, stage, swap), the committed `main.m` patch wiring, and any
> signed-device iOS run. Treat the API shapes below as the contract the client
> layer must implement.

## How a boot works

Both platforms end up executing JS from **app-private storage**, which is what
makes OTA possible without touching the binary.

**Android** (`@nativescript/android` 9.1.1): `RuntimeHelper.initRuntime`
extracts `assets/app` from the APK into `getFilesDir()/app` on first boot, once
per native package version (`DefaultExtractPolicy` thumb keys on
`lastUpdateTime-versionCode`). The runtime *always* executes from
`files/app` — files written there persist across restarts until the native
package itself is updated. No native redirect needed; the whole swap is a file
operation in JS.

**iOS** (`@nativescript/ios` 9.1.0): generated `platforms/ios/internal/main.m`
sets `config.BaseDir = [[NSBundle mainBundle] resourcePath]`, and the runtime
loads `<BaseDir>/app/<package.json main>.mjs`. There is no writable-dir
fallback in the binary, so the redirect is a ~15-line patch to `main.m`:

```objc
// platforms/ios/internal/main.m, right after baseDir init
NSString* otaBase = [NSHomeDirectory() stringByAppendingPathComponent:
    @"Library/Application Support/ota"];
if ([[NSFileManager defaultManager]
        fileExistsAtPath:[otaBase stringByAppendingPathComponent:@"app/package.json"]]) {
    baseDir = otaBase;
}
```

`internal/main.m` survives `ns prepare`/`ns build`; it is regenerated only on
platform add/update, so the patch belongs in the app's committed `platforms/`
or a prepare-time patch hook (the seam `nativescript-app-sync` used). The
presence check is deliberately file-existence: delete the payload directory and
the next boot falls back to the embedded bundle — that *is* the rollback path.
Because the check resolves against `NSHomeDirectory()` at boot, the payload is
always read from whatever container the app actually boots in (matters on the
simulator, where container UUIDs rotate).

## Architecture

```
publish:                       serve:
  vite app/ dir ──zip──► sha256 ──► R2 bundles/<sha256>         Cloudflare Worker (apps/ota-server)
  pointer JSON  ──────────────► R2 channels/<chan>/<plat>.json  ┌ GET /manifest ──► reads pointer, gates, returns {version, sha256, url}
                                                              └ GET /bundles/<sha256> ──► streams zip (immutable)
```

R2 is the single store; the Worker is stateless and does no writes. Publishing
a release is two `r2 object put`s — bundle first, pointer second, so a channel
can never reference an object that isn't there yet.

## Payload format

The payload is a **zip archive of the built vite `app/` directory** —
`bundle.mjs`, `vendor.mjs`, `rolldown-runtime-*.mjs`, and `package.json` with
`"main": "bundle"`, plus any emitted assets. Unpacked on device it becomes the
`app/` dir the runtime boots.

Two things the payload does **not** contain:

- **Native metadata.** `__TNSMetadata` is compiled into the binary at `ns
  build` time. An OTA bundle cannot call a native API the shipped binary
  doesn't already expose — adding or upgrading a NativeScript plugin, a leaf
  package with a native dependency, or `@nativescript/core` itself always
  requires a store release. This is what `minNativeVersion` exists to guard.
- **Dev-mode graph.** A development-mode bundle crashes a release binary
  (`__registerDomainDispatcher is not defined` — the inspector backend isn't
  registered). Payloads are always `ns build --release` / production vite
  output.

## Integrity and versioning

### Manifest fields

The channel pointer stored at `channels/<channel>/<platform>.json` and the
manifest the worker serves share one schema:

| Field              | Type          | Meaning                                                                 |
| ------------------ | ------------- | ----------------------------------------------------------------------- |
| `version`          | `"x.y.z"`     | JS payload version. Numeric semver only — no prerelease/build suffixes. |
| `sha256`           | 64-hex string | SHA-256 of the zip payload; also the R2 object key under `bundles/`.    |
| `size`             | number        | Zip size in bytes; lets the client preflight storage and show progress. |
| `minNativeVersion` | `"x.y.z"`     | Oldest native binary version allowed to apply this payload.             |
| `releasedAt`       | ISO 8601      | When the pointer was published. Informational.                          |

Served responses add `channel`, `platform`, `updateAvailable`, and a computed
`url` (`<origin>/bundles/<sha256>`); gated responses carry `reason` instead.

### Integrity model: sha256-verified, not signed

The client downloads the zip, hashes it, and installs only when the digest
equals the manifest's `sha256`. The manifest itself arrives over TLS from the
worker origin, so authenticity reduces to "did we talk to our server."

What this does not cover: a compromised server could serve a malicious
manifest+payload pair, since the hash is only as trustworthy as the channel
that delivered it. The honest upgrade path is a detached signature — sign the
pointer JSON (or the zip digest) with an Ed25519 key, ship the public key in
the native binary, and verify on-device before staging. Add a `signature`
field to the pointer when that lands; the manifest schema has room. SHA-256
verification is the right scope for the first version — it fully protects
against corrupted downloads and content drift, and the TLS termination point
is infrastructure we already control.

### Versioning rules

- `version` is the JS payload's semver, independent of the native binary's
  version. Publish order is monotonic per channel+platform.
- `minNativeVersion` compares as a three-integer tuple against the native
  app's version. Bump it whenever a payload relies on a native surface
  introduced after older binaries shipped — safer to bump than to debug a
  missing plugin at runtime.
- `channel` selects the pointer: `stable` is the default; use `staging` or
  per-release channels for ring deploys. Names match `[a-z0-9-]{1,32}`.

## Apply semantics: install-when-restarting

The contract on both platforms is **install-now, apply-on-next-launch**:

1. Download → verify sha256 → unzip into a staging dir → swap into the boot
   location (iOS: `Library/Application Support/ota/app`; Android: `files/app`,
   keeping a backup dir for rollback).
2. The *next cold boot* runs the new code. Nothing is applied mid-session by
   default — on iOS there is no safe in-session apply on the shipping runtime
  (`restartWithConfig` is embedder-only and kills JS-backed delegates), and on
   Android the only path is a full process restart, which is additionally
   BAL-blocked on ColorOS/Android 15+ (the scheduled-alarm relaunch gets
   `BAL_BLOCK` even with the API-34 opt-in — see the gate record).
3. Payloads persist: Android's extract thumb doesn't change, iOS keeps booting
   the OTA dir while `ota/app/package.json` exists.

In-session apply is **upstream-gated**, not designed-around:
`NativeScriptRuntime.reloadApplication(baseDir?)` is the soft-reboot API in
open upstream PRs (NativeScript/ios#384, NativeScript/android#1963), present
in no released runtime, with delegate-lifetime concerns still under iOS
review. Core 9.1.2 already ships the JS-side support. Any client must feature
detect and degrade silently:

```ts
if (typeof (globalThis as any).NativeScriptRuntime?.reloadApplication === 'function') {
	// soft-apply: re-run the bundle against the staged baseDir
} else {
	// contract: applied on next launch — tell the user, never force-restart
}
```

Never ship a code path that *requires* in-session apply.

## Rollback

**Server-side:** repoint the channel at the previous pointer object (bundles
are content-addressed and never deleted on republish, so every old pointer
remains valid):

```sh
wrangler r2 object put octane-xplat-ota-bundles/channels/stable/ios.json \
	--file previous-pointer.json --content-type application/json
```

This stops *new* installs of the bad bundle. Devices that already installed it
keep it — pointer rollback is not a recall.

**Device-side:** removing the payload restores the embedded bundle. iOS: delete
`Library/Application Support/ota` (the `main.m` check then fails → embedded
boot). Android: restore the backup over `files/app` (or delete the added files
— the extract policy won't re-extract, so the backup must be real). A client
should always keep the previous payload (or the embedded baseline manifest) so
a crash-on-boot watchdog can revert before re-presenting UI.

## Server API

Base: the deployed worker origin (`https://octane-xplat-ota.<account>.workers.dev`
or a custom route).

`GET /manifest?platform=&channel=&nativeVersion=&currentVersion=`

- `platform` — required, `ios` | `android`.
- `channel` — optional, default `stable`.
- `nativeVersion` — optional `x.y.z`; when present, payloads gated by
  `minNativeVersion` are withheld.
- `currentVersion` — optional `x.y.z`; when equal to the pointer's `version`,
  the response is `updateAvailable: false, reason: "up-to-date"`.

Responses:

```
200 {"updateAvailable":true,"channel":"stable","platform":"ios",
     "version":"1.4.2","sha256":"<64 hex>","size":1234567,
     "minNativeVersion":"1.2.0","releasedAt":"…","url":"<origin>/bundles/<sha256>"}
200 {"updateAvailable":false,"reason":"up-to-date"|"min-native-version",…}
400 {"error":"bad-request","detail":"…"}
404 {"error":"no-release"}          # no pointer for channel+platform
502 {"error":"bad-pointer"}         # pointer object malformed — server-side bug
```

`GET /bundles/<sha256>` streams the zip (`application/zip`, `ETag: "<sha256>"`,
`Cache-Control: public, max-age=31536000, immutable`). `HEAD` answers size
without body. `GET /healthz` returns `ok`.

## Debugging runbook

Ordered for the 2am case — start at the symptom.

### Where is the app actually booting from?

The question to answer first. `currentApp`-style reporting: have the app log
or display its app dir at boot.

- **Android:** `adb shell run-as <pkg> ls files/app` on debug builds shows the
  live boot dir. Release builds refuse `run-as` — read state via an in-app
  status surface or a marker file the app writes under `files/` and logs.
  `files/app` is *always* the boot source on Android; if the wrong code runs,
  the wrong bytes are in that dir.
- **iOS:** inside the sim container —
  `xcrun simctl get_app_container <sim> <bundle-id> data` then inspect
  `Library/Application Support/ota/app`. The patched `main.m` NSLogs
  `exists=…` and `booting OTA bundle` at launch (visible in device console /
  `xcrun simctl spawn booted log stream`). `exists=0` → embedded boot; the
  check is `ota/app/package.json`, so a partially-copied payload (zip half-
  unpacked) falls back cleanly.
- **Verify the bytes, not the path:** `shasum -a 256 payload.zip` must equal
  the manifest `sha256`. If the zip verifies but the running code is old, the
  payload wasn't unpacked into the boot location or the app never restarted —
  apply is next-launch, not live.

### Symptom → check

| Symptom | Likely cause | Check |
| --- | --- | --- |
| OTA "installed" but old code runs | App wasn't cold-restarted; iOS `exists=0` | Kill and relaunch (don't background/resume); check `ota/app/package.json` exists |
| Crash on first OTA boot, then fine | N/A — should never auto-recover; if it does, a watchdog deleted the payload | Confirm payload zip sha256 matches manifest |
| `__registerDomainDispatcher is not defined` | Dev-mode vite graph published as payload | Rebuild payload with release/prod vite output |
| Manifest 404 | No pointer for that channel/platform, or wrong channel param | `wrangler r2 object get octane-xplat-ota-bundles/channels/<channel>/<platform>.json` |
| Manifest `min-native-version` | Payload predates this binary | Publish with a lower `minNativeVersion` only if the JS truly doesn't touch newer native surfaces; otherwise ship a native release |
| `bad-pointer` 502 | Pointer JSON missing fields / bad sha256 | Fetch the pointer object and validate against the schema table |
| Android self-restart never fires | BAL block (ColorOS/Android 15+) | Expected — the contract is next-launch; don't rely on programmatic restart |
| iOS sim: payload "disappears" between runs | Data-container UUID rotated on rebuild | Reinstall the payload in the new container; harmless on device |
| Bundle download 404 but manifest 200 | Publish order inverted (pointer before bundle) or object deleted | `wrangler r2 object get …/bundles/<sha256>`; republish the bundle then re-put the pointer |

### Server-side inspection

```sh
# what does the channel currently point at?
curl 'https://<origin>/manifest?platform=ios&channel=stable&nativeVersion=9.9.9'

# read the pointer object directly
wrangler r2 object get octane-xplat-ota-bundles/channels/stable/ios.json

# live request logs (errors, console output)
wrangler tail octane-xplat-ota
```

### Recovering a bad swap

iOS is self-healing by construction: delete the payload dir and the next boot
is embedded. Android requires restoring bytes — without a backup, the only
recovery is `adb shell pm clear <pkg>` (debug) or reinstall, which is why the
client contract keeps the pre-swap copy until the new bundle has booted
cleanly once.

## Known limits

- iOS redirect verified on an unsigned Release-configuration simulator build
  only — no signed-device run yet (none was available at gate time).
- No staged/percentage rollout: a channel pointer is all-or-nothing. Ring by
  channel (`staging` → `stable`) or add rollout fields later.
- No signing (see integrity model); sha256 + TLS only.
- Android release builds mute JS console — always ship a UI/log-marker channel
  for verification in release.
- Bundle downloads are unauthenticated; the sha256 *is* the address. If bundle
  secrecy matters, put the worker behind auth or signed URLs — not currently
  needed for app-update distribution.
