# Apply platform-specific CSS

ID: platform-styling
Targets: web, ios, android
Related APIs: xplatCss, @platform, .web.css, .mobile.css, .ios.css, .android.css

## Starting point

An app has shared CSS and working renderer Vite plugins. The developer wants
small platform differences or a separate stylesheet without runtime branches.

## Requirements

- Keep portable declarations shared and isolate platform-specific declarations.
- Choose replacement or explicit composition for whole stylesheets.
- Diagnose invalid conditions and preserve normal CSS cascade behavior.

## Acceptance criteria

- AC1: A web block applies in a browser and is absent from native output; mobile and OS blocks apply only to their matching targets.
- AC2: CSS imports select one platform sibling with fallback; explicitly composed shared and platform styles remain separate imports.
- AC3: Nested blocks, media queries, keyframes, and layers retain normal ordering and specificity; invalid targets fail with a source diagnostic.
- AC4: Setup preserves existing PostCSS plugins and explains renderer support boundaries.

## Documentation

- AC1: [Style one platform](../../../docs/app/styling.md#style-one-platform) and [pipeline tests](../../../packages/cli/test/css-platform.test.mjs).
- AC2: [CSS file variants](../../../docs/platform/module-resolution.md#css-file-variants).
- AC3: [Style one platform](../../../docs/app/styling.md#style-one-platform).
- AC4: [Style one platform](../../../docs/app/styling.md#style-one-platform).
