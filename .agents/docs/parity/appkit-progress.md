# Native macOS implementation progress

Target: native AppKit, issue #62. The immutable audit at `720c9ef93`
remains a source snapshot; do not regenerate shared snapshots while the
three desktop tasks share this checkout.

## Priorities and evidence boundary

Assume everyday document workflows, settings, inbox filters and view switches
have higher demand than charts, GPU effects or niche integrations. The
sandbox's segmented-control examples and table inbox/page templates exercise
selection, child items, disabled options and fill layout. FileInput's maintained
gallery establishes file picking as an ordinary app flow.

No native runtime, OS input, VoiceOver, packaging or visual checks have been
run for the changes below. Heavy verification needs explicit authorization
from the human assigned to this task. Other tasks' approvals do not apply.

## Files

The AppKit leaf now implements UTF-8 reads, chunked binary reads, size limits,
cancellation, Documents writes and NSSavePanel export. The source handles
security-scoped access cleanup and atomic write failures. Starting-folder
options are passed to NSOpenPanel. No persistent security bookmark is stored.
MIME filters still use a finite table and unknown types are unrestricted.
These are implementation claims, not evidence of real picker/sandbox behavior.

Bridge tests cover binary reads, cancellation, size limits, resource cleanup,
offset byte views, atomic failure, export cancellation and concurrent exports.
The tests are authored but not executed. Text decoding, picker interaction,
large-file responsiveness and real sandbox access still require qualification.
Lightweight TypeScript transpile diagnostics found no syntax errors in the
changed files service, its types and its new bridge tests. `git diff --check`
also passed for this change. Neither check resolves types or executes tests.

## Deferred verification

Run only after this task receives the human's go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/files -- src/files.macos.test.ts src/files.bridge.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/files
pnpm check:recipes
```

The files package currently has no typecheck script; the filter still checks
its dependents and their declared environments. Confirm the actual selected
checks before reporting coverage. Native NSOpenPanel/NSSavePanel interaction,
UTF-8 and binary round trips, picker cancellation, security-scoped access,
readonly destinations and packaged consumer behavior require a separate
AppKit runtime fixture and OS interaction after authorization. No command-only
bridge test establishes those outcomes.
