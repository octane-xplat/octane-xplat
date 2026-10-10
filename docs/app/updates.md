# Update a phone app between store releases

> Deliver a JavaScript or image update to an installed phone app, then activate
> it the next time the user opens the app from a fully closed state.

This optional workflow supports iOS and Android release builds. The client is
implemented in the repository but its first npm release is pending. The
release lifecycle is tested on a simulator/emulator; signed physical iOS
qualification remains a gap. Store policies still govern which changes you
may distribute. Adding a native plugin, changing permissions or upgrading the
native runtime needs a new binary through your normal release process.

## Set up the binary once

You need a working phone app and a deployed update server. The maintained
[Worker/R2 backend](../../apps/ota-server/README.md#deploy-human-step) describes
how to create storage and deploy the server. Framework installation does not
create a Cloudflare account or deploy a service.

Once this package is released, run these commands in your app directory. The
second command creates a hook that adds native startup recovery during builds.
Commit that hook alongside the dependency change.

```sh
pnpm add @octane-xplat/updates
pnpm exec xplat updates init
```

Rebuild and distribute both native binaries after enabling the hook. An older
binary cannot gain the boot guard from a JavaScript update. Use your existing
signing setup when making an Android release; simulator iOS builds are useful
for development but do not qualify a signed device release.

```sh
pnpm exec ns build ios --release
pnpm exec ns build android --release
```

The hook supports the standard NativeScript iOS Objective-C startup and
Android `com.tns.NativeScriptApplication`. A custom Android Application or iOS
SwiftUI embedder needs its own native startup integration. Unknown templates
fail the build instead of quietly dropping recovery.

## Create one client

Create `src/updates.ts` using your deployed Worker's HTTPS origin. The embedded
version identifies the JavaScript included in this binary; native OS versions
are read separately and normalized, for example `1.0` becomes `1.0.0`. Payload
and configured embedded versions use numeric `x.y.z`.

```ts
import { createUpdates } from '@octane-xplat/updates'

export const updates = createUpdates({
	endpoint: 'https://updates.example.com',
	embeddedVersion: '1.0.0',
	channel: 'stable',
})
```

Web, macOS, Linux, Windows and debug/LiveSync builds return `supported: false`.
Keep update calls behind that check; the same public types work on all targets.
Create `src/startup.ts` for the confirmation function below.

```ts
import { updates } from './updates'

export function confirmStartup() {
	if (updates.supported) updates.markHealthy()
}
```

Call `confirmStartup()` when the app's essential screen and required data are
ready. Do not confirm at module import time. A downloaded bundle starts with a
native pending marker. If startup fails or the user closes that first launch
before confirmation, the following cold launch restores the last backup.
When no backup exists, it restores the original bundled app. App documents and
settings are retained.

```ts
import { confirmStartup } from './startup'

export async function finishStartup(loadRequiredData: () => Promise<void>) {
	await loadRequiredData()
	// Call this after the essential screen has also reported that it loaded.
	confirmStartup()
}
```

## Check and install

After confirming startup, check the channel and stage an available update.
Installation verifies bytes and extracts into a separate directory. It does
not change the running version or restart the app. Handle a rejected promise
like a failed network request: keep the working app available and retry later.

```ts
import { updates } from './updates'

export async function checkAfterStartup() {
	if (!updates.supported) return
	try {
		const result = await updates.check()
		if (result.available) {
			await updates.install(result.manifest)
			console.log('Update ready for the next time the app opens')
		}
	} catch (error) {
		console.warn('Update check or download failed', error)
	}
}
```

Inspect the current and staged versions to show an update message or diagnose
whether a cold launch happened. Backgrounding and resuming the same process
does not apply the staged code.

```ts
import { updates } from './updates'

console.log(updates.status())
// Before relaunch: { currentVersion: '1.0.0', stagedVersion: '2.0.0', needsConfirmation: false }
// After relaunch:  { currentVersion: '2.0.0', stagedVersion: null, needsConfirmation: true }
```

The maintained [startup helper](../../examples/updates/startup.mobile.ts)
combines confirmation and checking. Integrate it at your app's own ready point;
it is not a timer that assumes startup succeeded.

## Publish and validate

Build production phone JavaScript, then use the server's publishing script
with the built Vite `app/` directory. The script zips it, uploads the
content-addressed bundle, then changes the channel pointer. Choose the minimum
native version yourself: it must include every native API the update calls.
There is no automatic native dependency fingerprint check yet.

```sh
# From the framework repository's apps/ota-server directory:
pnpm publish:bundle -- --dir /path/to/built/app --platform ios \
  --version 2.0.0 --min-native 1.0.0 --channel staging --dry-run
```

Remove `--dry-run` only when ready to upload to your configured R2 bucket. Build
and publish Android separately. Never publish a development bundle; it may
reference inspector APIs missing from a release binary.

### Verify installation and recovery

Before moving an update to the stable channel, validate on your own release
binary: stage it, fully close and reopen, confirm the new version, then repeat
with a test update that fails before confirmation. Reopen again and check that
the previous version returns. The maintained release test exercises that
sequence with a local fixture server; it does not qualify a hosted deployment.

```sh
# From the framework repository, choose your own test device IDs:
node scripts/with-target-lock.mjs ios -- \
  node packages/updates/tests/native-lifecycle.mjs --target ios --device SIMULATOR_UDID
node scripts/with-target-lock.mjs android -- \
  node packages/updates/tests/native-lifecycle.mjs --target android --device EMULATOR_SERIAL
```

## Recover a release

For a manual device rollback, request restoration at the next cold launch.
When there is no remaining backup, the immutable binary's embedded app is used.
The request discards any staged update. It never clears the user's app data.

```ts
import { updates } from './updates'

if (updates.supported) {
	updates.rollback()
	console.log('Previous version will return when the app next opens')
}
```

The most recently failed or manually rolled-back bundle hash is rejected by
`check()` and `install()` on that device. Publish a fixed bundle with a different
hash. A native binary version change clears the old OTA state, so old downloads
cannot replace the newly installed embedded app.

```ts
import { updates } from './updates'

export async function inspectChannel() {
	if (!updates.supported) return
	const result = await updates.check()
	if (!result.available && result.reason === 'rejected') {
		console.log('This device already rejected that bundle; publish a fixed bundle')
	}
}
```

Changing a server channel back to an older pointer stops new installs of the
bad release, but cannot repair a process that is already running bad code.
Native boot recovery works independently of the downloaded JavaScript. See
[server rollback](../../apps/ota-server/README.md#roll-back-a-channel) and the
[process design](../notes/ota-process.md#rollback) for operator details.

## Integrity and other targets

This release checks SHA-256 over HTTPS but does not verify a publisher
signature. The server and its TLS connection are trusted; a compromised server
can publish a matching malicious manifest and archive. Limits default to
32 MiB compressed and 128 MiB expanded. Archive paths must stay inside the
staged app directory; corrupt bytes, missing entries and incompatible minimum
native versions fail before activation.

```ts
import { createUpdates } from '@octane-xplat/updates'

const updates = createUpdates({
	endpoint: 'https://updates.example.com',
	embeddedVersion: '1.0.0',
	maxDownloadBytes: 16 * 1024 * 1024,
	maxExpandedBytes: 64 * 1024 * 1024,
	timeout: 30000,
})
```

Browser apps use [Web deployment](../../recipes/web-deployment.md); there is
no service-worker updater in this package. Desktop hosts have different startup
and package formats from NativeScript's `app/` payload and boot hooks, so this
installer cannot safely swap their code. Desktop update delivery remains
unimplemented; the capability check exposes that limitation.
