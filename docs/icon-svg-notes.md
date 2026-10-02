# Native SVG rendering on AppKit

Use the existing `NSImageView` image pipeline as the first candidate for
`@octane-xplat/icons` on AppKit. A native-host experiment passed on macOS
27.0.1 (26A434), Apple Silicon, without a new dependency. This is a proven
prototype path, not shipped macOS support: the icons package still has only
web and mobile entries.

## Proposed leaf boundary

Keep collection resolution and `iconToSvg` shared. A future `Icon.macos.tsrx`
would subscribe to the same registry, convert the resolved icon with a concrete
color, and send its markup to UI's macOS `Image` as a base64 data URI:

```text
bundled Iconify JSON → shared SVG markup → UTF-8/base64 data URI
→ Image.macos → NSData → NSImage → NSImageView
```

The DOM-free, macOS-only encoding helper tested in the prototype was:

```ts
declare const NSString: any

export function svgDataUri(markup: string): string {
	const data = NSString.stringWithString(markup).dataUsingEncoding(4)
	return `data:image/svg+xml;base64,${data.base64EncodedStringWithOptions(0)}`
}
```

Here `4` is `NSUTF8StringEncoding`. Production code should use the available
platform declarations and handle failed encoding explicitly. It needs no DOM,
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
establish SVG's first supported OS release. Before shipping this leaf, test a
small SVG through public `NSImage` APIs on the minimum supported OS and define
explicit failure behavior for unsupported decoding. Do not infer runtime SVG
support from successful compilation against a newer SDK.

If the minimum OS cannot decode SVG, evaluate a leaf-owned native fallback.
[SVGKit](https://github.com/SVGKit/SVGKit) supports macOS but requires native
integration; [resvg](https://github.com/linebender/resvg/tree/main/crates/c-api)
offers a C rasterization API but requires distributing its native implementation.
Both add packaging and maintenance work. A handwritten path-only parser would
narrow the accepted Iconify JSON bodies and needs an explicit compatibility
contract before consideration.

## Remaining integration

Add the macOS component, explicit platform barrel/export condition, renderer
build/typegen support, and matching public declarations. Preserve the existing
props and exports, reactive collection updates, and per-instance SVG IDs.
Map `label` to the macOS image's `accessibilityLabel`; the current image host
does not demonstrate the full `id`/`className` contract. Promote the prototype
to a maintained macOS probe when support ships, and reconcile README/recipe
coverage then. The bundled-icons recipe is unchanged by this investigation.
