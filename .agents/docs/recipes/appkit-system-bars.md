# Import the unsupported phone system-bar API safely on AppKit

ID: appkit-system-bars
Targets: macos
Related APIs: systemBars, setStatusBarStyle, setColor

## Starting point

Shared app setup can import phone-style system-bar helpers. AppKit has no
phone status/navigation bar contract; callable facade presence is not a
native chrome implementation or an accepted not-applicable decision.

## Requirements

Keep imports and method shapes consistent while making the unsupported
boundary explicit. Avoid phone helpers and do not imply a desktop chrome effect.

## Acceptance criteria

- AC1: Root and canonical/existing .ts subpaths select the same dedicated AppKit object and paired generated types, expose both shared void methods with matching arguments, avoid phone Application/Color dependencies and preserve other-target defaults. Calls emit only a fixed warning; diagnostics failure cannot turn them into app failures or expose argument data.
- AC2: Guide, README, known limits, skill, fix note and target note distinguish the import/shape repair from native styling or an accepted not-applicable decision. Author three source models and expand isolated packed runtime/declaration checks; keep them unrun and record exact deferred commands and native/installed qualification limits.

## Documentation

- AC1: [Service guide](../../../docs/platform/platform-services.md#system-bars-on-appkit), [AppKit leaf](../../../packages/platform/src/system-bars.macos.ts), [root](../../../packages/platform/src/index.macos.ts), [export map](../../../packages/platform/package.json), [source models](../../../packages/platform/tests/appkit-system-bars.test.mjs) and [packed checks](../../../packages/platform/tests/packed-consumer.mjs).
- AC2: [Package README](../../../packages/platform/README.md), [known limits](../../../docs/testing/known-limits.md#platform-services), [skill](../../skills/octane-xplat/references/services.md#appkit-system-bar-import-boundary), [fix note](../../../.changelog/fixes/appkit-system-bars-imports.md) and [target note](../exploration.md#operational-evidence). No runtime/installed qualification or issue-contract acceptance is claimed.
