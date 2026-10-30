# Platform qualification artifacts

This directory holds retained platform fixtures, patch sources, and raw evidence.
Contributor guidance and conclusions live in [`.agents/docs/`](../../.agents/docs/README.md);
this directory is not a public package or a claim of platform support.

Retained sources and reports are excluded from repository formatting/linting so
style passes do not alter pinned reproductions. Their owning regression and
qualification checks still apply. Desktop audit runner source is maintained
separately in `tools/desktop-support/`; its raw snapshots are also unformatted.

| Path | Purpose |
| --- | --- |
| `patches/` | Candidate/source repairs; applied consumer patches remain in `packages/cli/patches/` |
| `windows-input-contracts/` | Native Windows input fixture and OS driver |
| `windows-layout/` | Percentage-size regression and native geometry/popover fixtures |
| `windows-rich-text/` | Candidate preparation, object-driver tests, native fixtures, and pinned evidence |
| `ios-editor-backing/` | Standalone compile/link and metadata diagnostics; [findings](../../.agents/design/evidence/ios-editor-backing/results.md) |
| `evidence/` | Dated probe output, inventories, and frozen AppKit/Windows qualification reports |

Use the owning [Windows repair notes](../../.agents/docs/parity/windows-support-progress.md)
and [AppKit qualification guide](../../.agents/docs/parity/appkit-progress.md) to
choose a check. Frozen reports preserve their original checkpoint claims and
artifact references; they are not current instructions. Never upgrade a
source/build result to OS, accessibility, or visual qualification.

The installed Windows percentage-sizing regression is part of the root scripts
suite, which runs through Turbo:

```sh
pnpm exec turbo run test:scripts --filter=//
```

Native probes and device builds require the repository's resource reservations.
Do not run every retained fixture merely because it exists.
