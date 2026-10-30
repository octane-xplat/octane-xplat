# Read consistent locale and device metadata on AppKit

ID: appkit-locale-metadata
Targets: macos
Related APIs: locale, device, Locale, DeviceInfo, Intl.Locale, matchLocale

## Starting point

A native AppKit app needs language/region metadata for ordinary localized
screens, settings or diagnostics. It can import the platform root or a service
subpath; metadata must not require the phone Device shim.

## Requirements

Read a consistent initial formatting locale, distinguish script from region,
understand its fallback and lifetime, and choose app translation catalogs
separately. Keep generated declarations and runtime selection aligned.

## Acceptance criteria

- AC1: Root and canonical locale/device subpaths, including existing .ts spellings, select dedicated AppKit runtime and type leaves without a phone Device import. Keep other-target defaults and shared public shapes unchanged.
- AC2: Preserve the canonical full tag while separating language and optional region (script, numeric-region and extension tags included), normalize underscores and fall back to en/empty region on unavailable, throwing or invalid Intl read/parsing. Explain the module-load snapshot, unchanged Lingui detector and truthful macos/Mac/Apple/unknown-version device subset; do not imply live OS preference, preferred-language or hardware/version discovery.
- AC3: Reconcile guides, package README, skill, target note and released fix note. Author source identity/fallback/export models and packed runtime/declaration checks; distinguish source models and declaration plans from actual JSC/OS/relaunch/installed qualification, with exact deferred commands and open gates.

## Documentation

- AC1: [Metadata guide](../../../docs/platform/platform-services.md#read-appkit-locale-and-device-metadata), [package README](../../../packages/platform/README.md), [root](../../../packages/platform/src/index.macos.ts), [locale leaf](../../../packages/platform/src/locale.macos.ts), [device leaf](../../../packages/platform/src/device.macos.ts), [manifest](../../../packages/platform/package.json) and [packed source/decl lanes](../../../packages/platform/tests/packed-consumer.mjs).
- AC2: [Metadata guide](../../../docs/platform/platform-services.md#read-appkit-locale-and-device-metadata), [localization](../../../docs/app/localization.md#locale-detection), [skill](../../skills/octane-xplat/references/services.md#appkit-locale-and-device-imports) and [source models](../../../packages/platform/tests/appkit-metadata.test.mjs).
- AC3: [Target note](../exploration.md#operational-evidence), [packed AppKit declaration checks](../../../packages/platform/tests/packed-macos.test.mjs) and [fix note](../../../.changelog/fixes/appkit-locale-metadata.md) record deferred checks. Source models and packed/runtime/native/OS qualification require separate execution evidence.
