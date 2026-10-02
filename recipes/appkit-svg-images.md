# Render SVG images on AppKit

ID: appkit-svg-images
Targets: macos
Related APIs: @octane-xplat/ui, Image, Icon, registerIcons

## Starting point

An experimental AppKit app needs bundled SVG artwork or registered SVG glyphs
without a webview or an added UI dependency.

## Requirements

Render trusted SVG markup and data URIs using the native image host, update
sources, provide accessible labels, and understand OS compatibility limits.

## Acceptance criteria

- AC1: Pass inline SVG, percent-encoded SVG data URIs, or base64 SVG data URIs to `Image.src`; registered `Icon` SVG glyphs use the same native image pipeline.
- AC2: Update image sources and dimensions, use `alt` for the native accessibility label, and mark unlabeled images decorative.
- AC3: Distinguish the verified macOS version from the deployment minimum, recognize unsupported-decoder empty-image behavior, and avoid unsupported path/remote-URL source assumptions.

## Documentation

- AC1: [AppKit source grammar and integration](../docs/icon-svg-notes.md#implemented-integration) and [maintained AppKit probe](../examples/probes/icons.macos.tsrx).
- AC2: [AppKit integration](../docs/icon-svg-notes.md#implemented-integration) and [maintained AppKit probe](../examples/probes/icons.macos.tsrx).
- AC3: [Evidence and limits](../docs/icon-svg-notes.md#evidence-and-limits) and [source grammar](../docs/icon-svg-notes.md#implemented-integration).
