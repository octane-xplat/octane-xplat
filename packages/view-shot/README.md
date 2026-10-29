# Capture an app view

Turn a card or another part of your Octane Xplat app into an image for sharing
or saving. `@octane-xplat/view-shot` follows react-native-view-shot's function,
option and component shapes, adapted to Octane refs and lifecycle hooks.

## Capture a card

Start with a running Octane Xplat app and install the package in its directory.
Phone apps need NativeScript core 9.1.3 or later. Rebuild phone and native macOS
apps after installation so their capture bridge is included. A JavaScript-only
refresh cannot install native code.

```sh
pnpm add @octane-xplat/view-shot
```

Add this component to a screen. Press **Capture card** after the card has
appeared. A successful call reports that an image was created; a refusal
shows its message. Replace the comment with your sharing or saving operation,
and await that operation before releasing the temporary image.

```tsx
import { useRef, useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import ViewShot, { releaseCapture, type ViewShotRef } from '@octane-xplat/view-shot'

export function CaptureCard() {
	const card = useRef<ViewShotRef | null>(null)
	const [status, setStatus] = useState('Ready')
	async function save() {
		let uri: string | undefined
		try {
			if (!card.current) return
			uri = await card.current.capture()
			// Await your sharing or saving operation here, using uri.
			setStatus('Card image created')
		} catch (error) {
			setStatus(String(error))
		} finally {
			if (uri) releaseCapture(uri)
		}
	}
	return (
		<VStack>
			<ViewShot ref={card} options={{ format: 'png', result: 'tmpfile' }}>
				<Text>Trip to the coast</Text>
			</ViewShot>
			<Button label="Capture card" clickAction={() => void save()} />
			<Text>{status}</Text>
		</VStack>
	)
}
```

The wrapper owns a real layout container: a `div` on web and a `masonview` on
native hosts. Give it a visible, nonzero layout. Wait for images, custom fonts
and asynchronous children yourself; mounting does not mean those assets have
finished loading.

```tsx
<ViewShot ref={card} style={{ width: 320, height: 180 }}>
	<Text>Ready to capture</Text>
</ViewShot>
```

## Capture an existing host

`captureRef` accepts a mounted host object, its `{ current }` ref, or a ViewShot
component ref. The caller owns manual results. Numeric React handles and
unmounted refs reject. The maintained [ownership example](examples/capture-card.ts)
keeps an image alive until its consumer finishes.

```ts
import { captureRef, releaseCapture, type CaptureTarget } from '@octane-xplat/view-shot'

export async function exportCard(target: CaptureTarget) {
	const uri = await captureRef(target, { format: 'png', width: 640, height: 360 })
	try {
		// Await the operation that reads uri here.
	} finally {
		releaseCapture(uri)
	}
}
```

Both dimensions must be supplied together and are final image pixels. Omit
both to use the host's native pixel scale. Dimensions are positive integers,
at most 16,384 per side and 32 million pixels total. `quality` is 0–1 and
controls lossy encoding; PNG remains lossless. `base64` and `data-uri` return
inline strings. The default `tmpfile` returns an owned file URI on native
hosts and an owned blob URL on web; it is temporary, not durable storage.

```ts
import { captureRef } from '@octane-xplat/view-shot'

const inline = await captureRef(card, { format: 'png', result: 'data-uri' })
```

`captureScreen` captures the primary app window on iOS and Android. It does
not capture the whole desktop, other apps or all displays. Other hosts require
an explicit target through `captureRef`. Check capability before offering a
screen capture action; any individual operation can still reject.

```ts
import { captureScreen, viewShot } from '@octane-xplat/view-shot'

if (viewShot.capabilities.screen) {
	const uri = await captureScreen({ format: 'png' })
	// The caller must release uri when its reader finishes.
}
```

## Automatic captures and cleanup

Omit `captureMode` for manual use. `mount` attempts one capture after layout;
`update` also captures after component updates, coalescing updates while busy.
Automatic results are wrapper-owned: replacing the result or unmounting
releases its temporary resource. Finish consuming one before replacing the
wrapper's content. Avoid updating that same wrapper from `onCapture` in
`update` mode, which can produce a capture/update loop.

```tsx
<ViewShot
	captureMode="mount"
	options={{ format: 'png' }}
	onCapture={(uri) => console.log('Temporary card ready')}
	onCaptureFailure={(error) => console.log(error.message)}
>
	<Text>Ready on mount</Text>
</ViewShot>
```

Manual captures transfer ownership to the caller. `releaseCapture` is
idempotent and only releases exact resources created by this package; foreign
files and URLs are ignored. A manual result finishing after wrapper disposal
is released and the promise rejects. Inline strings need no resource cleanup.

```ts
import { releaseCapture } from '@octane-xplat/view-shot'

releaseCapture(uri)
releaseCapture(uri) // Already released: safe.
```

## Platforms and qualification

These are implemented API subsets, not a claim of verified image fidelity.
**Capture output is not runtime-qualified.** The maintained component check
uses a guarded string-only backend. Source/compiler checks,
iOS/macOS Swift API checks on `skymac.local`, and GTK API checks on
`andromeda.local` pass. Windows bridge source was inspected through `ssh windy`;
Windows adapter execution and output remain unverified. Android compilation
and runtime are deferred. Encoding, pixel fidelity, real output ownership,
protected-surface refusals and installed native consumers need runtime
qualification before relying on them in production.

| Host                        | Implemented view formats | App screen         | Boundary                                                              |
| --------------------------- | ------------------------ | ------------------ | --------------------------------------------------------------------- |
| Web                         | PNG, JPEG                | Unavailable        | DOM reconstruction using html2canvas-pro, not a compositor screenshot |
| iOS                         | PNG, JPEG                | Primary app window | UIKit hierarchy, or explicit `useRenderInContext: true`               |
| Android                     | PNG, JPEG, WebP          | Primary app window | Attached Android view; secure windows reject                          |
| Native macOS                | PNG, JPEG                | Unavailable        | Attached AppKit NSView                                                |
| Linux GTK                   | PNG                      | Unavailable        | GTK 4.14+ mapped widget, GSK renderer                                 |
| Experimental native Windows | PNG                      | Unavailable        | Attached XAML host and required WinRT projections                     |
| Linux DOM/webview           | PNG, JPEG                | Unavailable        | Select the web condition and browser backend                          |

Query the selected backend rather than assuming that the package's presence
makes an operation available. GTK has a dedicated `gtk` condition; a Linux
webview must use the web condition. The standalone native `linux` entry is
unavailable. Windows remains an experimental repository host.

```ts
import { viewShot } from '@octane-xplat/view-shot'

const canCapture = await viewShot.isAvailable()
const formats = viewShot.capabilities.formats
```

Web reconstruction depends on browser CORS rules and html2canvas-pro's CSS
coverage. Missing or cross-origin assets can be omitted; await loading and
serve readable assets. Iframes, embedded documents and video are rejected.
Native adapters reject detected web, video and GPU surfaces rather than
promising their pixels. Popups and separately owned windows are outside a
view's subtree. Full scroll-content capture, continuous mode, RAW/ZIP output
and Android GL handling are outside this subset and reject explicitly.
`fileName` is supported only on Android; use at least three ASCII letters,
digits, underscores or hyphens. `useRenderInContext` is iOS-only.

```ts
import { captureRef } from '@octane-xplat/view-shot'

const uri = await captureRef(card, { format: 'png', result: 'tmpfile' })
```

See the upstream [react-native-view-shot API](https://github.com/gre/react-native-view-shot)
and [DOM engine limitations](https://html2canvas.hertzen.com/documentation)
for context; this package's supported subset is the contract above.
