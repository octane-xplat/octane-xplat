# Native SVG rendering on AppKit

Use the existing `NSImageView` image pipeline for
`@octane-xplat/icons` on AppKit. A native-host experiment passed on macOS
27.0.1 (26A434), Apple Silicon, without a new dependency. The icons package now has an experimental macOS entry using this path.
Minimum-OS compatibility and pixel fidelity remain unverified.

## Platform boundary

Keep collection resolution and `iconToSvg` shared. `Icon.macos.tsrx`
subscribes to the same registry, converts the resolved icon with a concrete
color, and sends raw markup to UI's macOS `Image`, which encodes it:

```tsx
// A macOS-rendered .tsrx component using trusted bundled markup.
import { Image } from '@octane-xplat/ui'

const svg =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4338ca" d="M4 4h16v16H4z"/></svg>'
export function Mark() {
	return <Image src={svg} className="w-6 h-6" alt="Trip marker" />
}
```

```text
bundled Iconify JSON → shared SVG markup → Image.macos
→ UTF-8/base64 data URI → NSData → NSImage → NSImageView
```

The DOM-free Foundation encoding is owned by UI in `svg-image.macos.ts`.
Its public-API mechanism is:

```ts
declare const NSString: any

export function svgDataUri(markup: string): string {
	const data = NSString.stringWithString(markup).dataUsingEncoding(4)
	return `data:image/svg+xml;base64,${data.base64EncodedStringWithOptions(0)}`
}
```

Here `4` is `NSUTF8StringEncoding`. The implementation handles failed UTF-8 encoding explicitly. It needs no DOM,
Node buffer, network service, custom native library, or new UI dependency.

`packages/ui/src/Image.macos.tsrx` already forwards `src` and styles to the
AppKit `<image>` host. `makeImageView` and the image `src` update branch in
`apps/macos/src/renderer/index.mjs` decode base64 data and call
`NSImage.alloc().initWithData(data)`. The public
[NSImage data initializer](<https://developer.apple.com/documentation/appkit/nsimage/init(data:)>)
is the boundary to use. The observed representation class was
`_NSSVGImageRep`; that private class must not become a dependency or capability
check. ImageIO did not advertise SVG decoding on this host, so a
`CGImageSource` implementation is not interchangeable with this path.

```ts
// Native macOS host only; NSData is provided by the host's SDK metadata.
declare const NSImage: any
declare const NSData: any
const encoded = svgDataUri(
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24"/></svg>',
)
const data = NSData.alloc().initWithBase64EncodedStringOptions(encoded.split(',')[1], 0)
const image = NSImage.alloc().initWithData(data)
if (!image) throw new Error('System SVG decoding unavailable')
```

## Evidence and limits

**Lab experiment, 2026-10-02:** the isolated AppKit/JavaScriptCore probe passed
11 assertions. It exercised the real UI `Image` and renderer with shared icon
resolution/conversion, native encoding, and a reactive candidate component.
Assertions covered valid native images, representations, aspect-ratio sizing,
a gradient-containing body, a rotated alias, prop updates, and collection
replacement changing the mounted image's intrinsic width. A separate Swift
check confirmed `NSImage(data:)` accepted SVG through the system API.

The temporary case and results live under ignored `research/appkit-svg/`:

```sh
pnpm probe run research/appkit-svg/probe.macos.tsrx --target macos
```

This evidence establishes native decoding and host updates. No screenshots or
pixel comparison were performed; it does not establish paint fidelity,
accessibility traversal, or compatibility on older macOS releases.

The AppKit deployment minimum is currently macOS 13.5. SVG decoding on that
version remains unverified, and the public initializer documentation does not
establish SVG's first supported OS release. Before claiming support for the deployment minimum, test a
small SVG through public `NSImage` APIs on the minimum supported OS The current unsupported-decoder behavior is an empty image. Do not infer runtime SVG
support from successful compilation against a newer SDK.

If the minimum OS cannot decode SVG, evaluate a leaf-owned native fallback.
[SVGKit](https://github.com/SVGKit/SVGKit) supports macOS but requires native
integration; [resvg](https://github.com/linebender/resvg/tree/main/crates/c-api)
offers a C rasterization API but requires distributing its native implementation.
Both add packaging and maintenance work. A handwritten path-only parser would
narrow the accepted Iconify JSON bodies and needs an explicit compatibility
contract before consideration.

## Implemented integration

`Image.macos` normalizes inline SVG and percent-encoded SVG data URIs to base64;
already-base64 image sources pass through. SVG file paths and remote URLs are
not loaded by this AppKit image host. Use trusted bundled markup or data URIs.
UI's registered `Icon` now sends `svg`/`markup` glyphs through that same path;
font/name fallbacks retain their existing behavior. No dependency was added to UI.
The AppKit image host assigns the accessibility label through the property bridge
and marks empty-label images decorative.

```tsx
import { Image } from '@octane-xplat/ui'

export function DecorativeMark() {
	return (
		<Image
			className="w-6 h-6"
			alt=""
			src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Crect%20width%3D%2224%22%20height%3D%2224%22%2F%3E%3C%2Fsvg%3E"
		/>
	)
}
```

The icons leaf has a macOS export condition, compiled entry, and matching
public declarations. Its universal renderer import follows the AppKit app's
existing renderer alias. The maintained
[macOS icon probe](../examples/probes/icons.macos.tsrx) exercises UI inline SVG,
SVG data URIs, registered glyphs, and public leaf registration/prop updates:

```sh
pnpm probe run examples/probes/icons.macos.tsrx --target macos --deps @octane-xplat/icons
```

The maintained source-entry and compiled-entry probes each passed 21 assertions
on macOS 27.0.1. Web and iOS regression probes passed 14 assertions each.
Packed declarations passed Bundler and NodeNext for all three entries.

The bundled-icons recipe now includes macOS; the SVG-image recipe covers UI's
AppKit source grammar and compatibility boundary. Runtime checks establish
native metadata and updates only, not pixels or VoiceOver traversal.
