# Render SVG images on AppKit

ID: appkit-svg-images
Targets: macos
Related APIs: @octane-xplat/ui, Image, Icon, registerIcons, @octane-xplat/charts, Chart

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

- AC4: Render chart marks and native labels with the shared Chart props on AppKit; understand coordinate-free tap selection and unavailable touch scrubbing.

## Documentation

- AC1: [AppKit source grammar and integration](../docs/notes/icon-svg-notes.md#implemented-integration) and [maintained AppKit probe](../examples/probes/icons.macos.tsrx).
- AC2: [AppKit integration](../docs/notes/icon-svg-notes.md#implemented-integration) and [maintained AppKit probe](../examples/probes/icons.macos.tsrx).
- AC3: [Evidence and limits](../docs/notes/icon-svg-notes.md#evidence-and-limits) and [source grammar](../docs/notes/icon-svg-notes.md#implemented-integration).
- AC4: [AppKit charts](../docs/notes/charts.md#appkit-charts) and [maintained chart probe](../examples/probes/charts.macos.tsrx).
