# Compile Tailwind utilities through Xplat

ID: tailwind-css
Targets: web, ios, android, macos
Related APIs: @octane-xplat/tailwind, tailwind, className, @source, ui.css

## Starting point

An existing Xplat app evaluates the unreleased Tailwind candidate from an
installed tarball. The compiler is enabled for the public lockstep release;
first publication and full native qualification remain pending. The recipe
specifies the complete workflow criteria; links to candidate coverage do not
establish a passing host qualification.

## Requirements

- Compile official Tailwind utilities without a second generator or runtime.
- Preserve UI structure, runtime theme values, app CSS and cascade behavior.
- Select the correct platform sources and recover after development edits.
- Fail explicitly on unsupported generated native output.
- Verify installed packages and actual host behavior separately.

## Acceptance criteria

- AC1: A fresh consumer resolves the packed JavaScript and declarations, compiles global CSS with its existing Xplat preset, and reports duplicate compilers, missing presets and CSS Module misuse.
- AC2: UI structure/chrome and generated classes compose without curated-helper collisions. Root and nested runtime themes update generated colors/radii, including changes and removal across native root boundaries.
- AC3: Platform leaves replace their fallbacks; preferred-file creation/deletion and source edits update the generated classes. Removing an unsupported native candidate clears the error.
- AC4: Native layout, class replacement/removal, inline addition/removal, typography and responsive/mode updates have actual host evidence. Plain CSS compilation and browser computed styles do not substitute for native measurements.
- AC5: Unsupported generated declarations, values, selectors, at-rules, registrations, importance and contextual calculations fail with source diagnostics. Ordinary authored CSS retains its declarations, order and normal cascade priority.
- AC6: The Linux webview retains browser CSS with Linux leaves; GTK follows its separate native path. Setup states actual host limits, source-map limits and outstanding release requirements without claiming unrun targets.

## Documentation

- AC1: [Configure the compiler](../../../docs/packages/package-tailwind.md#configure-the-compiler), [installed consumer](../../../tools/tailwind-qualification/fixtures/packed-consumer.mts) and [configuration regressions](../../../packages/tailwind/test/compiler.test.ts).
- AC2: [App themes](../../../docs/packages/package-tailwind.md#use-app-themes), [UI theme tests](../../../packages/tailwind/test/theme.test.ts), [maintained UI app](../../../tools/tailwind-qualification/fixtures/app/App.web.tsrx). Gap: native UI Theme/modal/root lifecycle qualification.
- AC3: [Native boundary](../../../docs/packages/package-tailwind.md#native-generated-css-boundary) and [watch/source regressions](../../../packages/tailwind/test/compiler.test.ts).
- AC4: [Qualification boundaries](../../../tools/tailwind-qualification/README.md). Gap: maintained installed native UI host qualification covering the complete criterion; browser and earlier raw-host experiments have narrower scopes.
- AC5: [Native boundary](../../../docs/packages/package-tailwind.md#native-generated-css-boundary) and [value/cascade regressions](../../../packages/tailwind/test/native.test.ts). Mobile generated line heights are rejected because the host adds inter-line spacing; shared font-size-only utilities remain available. Gap: normal authored importance and native cascade-layer importance support remains owned by issue #202; generated importance is rejected.
- AC6: [Linux hosts](../../../docs/packages/package-tailwind.md#linux-hosts) and [separate compilation lanes](../../../tools/tailwind-qualification/fixtures/packed-consumer.mts). Gap: installed Xplat UI app lifecycles, native media delivery and development updates on the separate Linux hosts; CSS-only WebKit and source-driver GTK sessions cover narrower behavior.
