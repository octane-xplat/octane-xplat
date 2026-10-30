# Choose optional capabilities

Use for launch-screen ownership, optional service examples, permissions, background work, and production reporting. The [service index](../services.md) routes to focused host/feature contracts.

## In-app purchases

Follow the [purchase guide](../../../../../docs/platform/in-app-purchases.md) for
store setup, a maintained non-consumable controller, backend contracts and
qualification. Keep one billing owner per account. Never grant from a purchase
request or pending event; finish only after verified durable server grant, and
retain the native transaction object. Restore through the same idempotent path.
StoreKit 2 receiptToken is transaction JSON, not signed server proof; use the
store's verification API. The wrapper cannot await readiness (#70) and currently
re-fetches purchase requests as inapp (#69); do not claim subscription checkout.

## Background refresh

Use the [background guide](../../../../../docs/platform/background-work.md) for a
maintained task, distinct foreground/background execution evidence and startup
configuration. Registration is not execution. The current Android worker does
not bootstrap a dead runtime or correctly await JS completion (#71); iOS loses
task outcomes, lacks expiration handling and does not resubmit requests (#72).
Do not claim production periodic delivery. Register each iOS handler once before
launch completes, keep a foreground action, and report device evidence separately.

## Production error reporting

Use the [production-error guide](../../../../../docs/testing/production-errors.md)
for a browser SDK owner with filtering/collection controls, Debug ID artifacts
and project-delivery checks. The framework Sentry wrapper lacks those typed
controls (#73); native Vite artifact qualification remains open (#74).
Crashlytics is native-only and currently needs an explicit plugin import (#75).
Do not infer desktop support from a browser re-export or native crash delivery
from a handled JavaScript report. Keep upload tokens out of runtime config.

## Choose a capability and handle availability

For phone startup, use the
[launch-screen guide](../../../../../packages/splash-screen/README.md). Arm the
process-scoped hold in a module imported before Application.run(); a component
effect is too late. Reveal after the root Page loads and required data is ready.
Repeated prevention shares one native deadline, and a dismissed startup cannot
be re-shown. The native timeout does not call Updates.markHealthy. Do not infer
OS input/pixel parity or Android qualification from source checks; Android
runtime remains deferred, and browser/desktop hosts report unavailable.

```ts
import { SplashScreen, hide, preventAutoHideAsync } from '@octane-xplat/splash-screen'

// In the native startup module, before Application.run():
if (SplashScreen.capabilities.hold) {
 void preventAutoHideAsync().catch(() => console.warn('Launch screen could not be held'))
}
export function revealReadyPage() {
 if (SplashScreen.capabilities.hold) hide()
}
```

For interface orientation, use the [screen-orientation guide](../../../../../packages/screen-orientation/README.md).
Phone requests own the primary window, run in order, and reject OS refusals.
Forward the iOS delegate callback before Application.run(); retain an existing
delegate's other methods. Keep the maintained example's native class before its
imports: the qualified host's NativeScript decorator transform otherwise drops
the preceding statement separator. Remove subscriptions at the owning reader's cleanup.
Do not infer physical rotation from window dimensions, desktop support from a
browser entry, or Android runtime from TypeScript checks. Browser policy queries
remember only this module's last accepted request; the OS exposes no getter.

```ts
import { OrientationLock, lockAsync, supportsOrientationLockAsync } from '@octane-xplat/screen-orientation'

export async function requestLandscape() {
 if (await supportsOrientationLockAsync(OrientationLock.LANDSCAPE)) {
  await lockAsync(OrientationLock.LANDSCAPE)
 }
}
```

For OTA compatibility, use the Node-only
[fingerprint tool](../../../../../packages/fingerprint/README.md) as an app development
dependency, alongside the Updates runtime. Never import it into app code.
Regenerate an older prepare hook and rebuild binaries when adopting the exact
fingerprint protocol. Preserve the private `.xplat/fingerprints/<platform>.json`
record with the release artifact; a source-only hash omits actual compiler
context. Custom native generators must declare their additional inputs. The
publisher refuses changed native inputs and debug payloads; do not edit a stamp
to bypass that check. Current Android runtime qualification remains deferred.

```sh
bun add @octane-xplat/updates
bun add -D @octane-xplat/fingerprint
bun run xplat updates init
bun run xplat-fingerprint --dir . \
  --build-record .xplat/fingerprints/ios.json \
  --diff .xplat/fingerprints/ios.json
```

For image pixels, use the [image-manipulator guide](../../../../../packages/image-manipulator/README.md).
`image-crop` provides geometry; `ImageManipulator` creates a file from it. Keep
the original normalized dimensions for selection, and pass whole-pixel natural
coordinates to crop. Contexts, rendered refs, and encoded results have separate
owners; the hook releases only its context. Initial bounds do not cap peak
decoder memory, and native operations currently run on the calling JS thread.

```ts
import { ImageManipulator } from '@octane-xplat/image-manipulator'

export async function resizePhoto(sourceUri: string) {
	const context = ImageManipulator.manipulate(sourceUri)
	let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined
	try {
		context.resize({ width: 800 })
		image = await context.renderAsync()
		return await image.saveAsync({ format: 'jpeg', compress: 0.8 })
	} finally {
		image?.release()
		context.release()
	}
}
// The caller owns the returned result until releaseImage(result).
```

For a custom device gallery or album editor, use the modern `Asset`, `Album`,
and `Query` API in the [media-library guide](../../../../../packages/media-library/README.md).
Use `media` for attachment picking alone. Read permissions without prompting;
request from an app action and preserve limited access. IDs are library records,
not files: Apple `getUri` exports a separately owned temporary file, while Android
returns a content URI. Release exports after their consumers finish. Page
metadata before exporting files, and remove each owner's change subscription.
Android runtime is unverified; AppKit is experimental and its authorized data
paths are unverified. Web/GTK/native Windows have no device-library backend.

```ts
import { AssetField, Query } from '@octane-xplat/media-library'

// Run after permission is granted; refresh from offset zero on library changes.
export function photoPage(offset: number) {
	return new Query()
		.orderBy({ key: AssetField.CREATION_TIME, ascending: false })
		.limit(20)
		.offset(offset)
		.exeForMetadata()
}
```

For payments, use the [Stripe checkout guide](../../../../../packages/stripe/README.md).
Initialize the app-scoped SDK once with a publishable key; the backend owns
amounts, Intents and webhook fulfilment. Client completion is not payment
settlement. The current subset is guest PaymentIntents; web requires a card-only
Intent and its own HTTP(S) return route. Native wallets need merchant setup.
Do not reconfigure or reset while presentation is active, and never log client
secrets. Native desktop hosts are unavailable and Android runtime is unverified.
When changing the iOS SDK setup, use its exported SPM library products, not
internal module names; see the [Stripe packaging evidence](../../../../docs/notes/stripe.md#spm-products-and-modules) before editing the leaf's supplied configuration.

```ts
import { initPaymentSheet, presentPaymentSheet } from '@octane-xplat/stripe'

export async function checkout(paymentIntentClientSecret: string, returnURL: string) {
 const initialized = await initPaymentSheet({ merchantDisplayName: 'Example store',
  paymentIntentClientSecret, returnURL })
 return initialized.error ? initialized : presentPaymentSheet()
}
// Verify the order on the app server after a successful client result.
```

For printing and PDF reports, use the [print guide](../../../../../packages/print/README.md).
Check `Print.capabilities` per operation. Browser print UI does not return a PDF
file, and Android dispatch does not prove a job printed or even finished its
chooser. Keep outputs until all readers finish; external share dispatch alone
does not end that lifetime. Native printing/export is app-scoped, serialized,
and uses static HTML. Keep its presenting window alive and handle cancellation
using the documented platform result. Native GTK/Windows remain unavailable;
Android runtime is unverified.

```ts
import { printToFileAsync, releasePrintFile } from '@octane-xplat/print'

export async function withPdf(html: string, consume: (uri: string) => Promise<void>) {
 const result = await printToFileAsync({ html })
 try { await consume(result.uri) }
 finally { releasePrintFile(result) }
}
```

For local document workflows, use the [files package guide](../../../../../packages/files/README.md).
Its experimental AppKit leaf implements local reads, Documents writes and
save-panel export; do not infer sandbox, OS picker or packaged-app qualification
from its source or bridge tests. Picked grants are session-scoped.

```ts
import { files } from '@octane-xplat/files'

const file = await files.pick('text/plain')
if (file) console.log(await files.readText(file))
```

Read the [platform services guide](../../../../../docs/platform/platform-services.md)
for current capabilities, permissions, and target behavior. Media, storage
engines, and plugin-backed services may live in leaf packages rather than the
platform barrel. Select the owning package from its guide and export map;
do not infer support from a similarly named browser API. For adding new
framework services, apply the dependency and lifecycle criteria in
[architecture](../../../../docs/architecture.md).

## Combined service qualification

For combined service qualification, use the
[packed listening/settings fixture](../../../../../tools/native-readiness/README.md).
It installs tarballs outside the workspace and typechecks before running.
Synthetic auth callbacks and silent foreground media do not establish real
provider callbacks, audible output, or background execution. Keep those gates
separate when interpreting a passing consumer run.

```sh
bun run turbo run check:native-readiness --filter=// -- --target ios --device OWNED_UDID
```
