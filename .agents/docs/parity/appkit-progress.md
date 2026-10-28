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

## SegmentedControl

Replaced the macOS placeholder with self-drawn options/child items, field
state, controlled/uncontrolled selection, disabled/read-only guards, fill
classes and icon labels. A scoped AppKit monitor implements wrapping arrows,
Home/End, RTL horizontal order, current native subview ordering and cleanup.
It preserves other responders/windows and modified shortcuts. The renderer
now maps radio/radiogroup to native roles and radio checked state to 0/1.
Enter/Space remain on its existing tappable-host path.

New source, key-adapter regressions and renderer regression edits pass the
TSRX parser. Tests have not executed. The maintained
`examples/probes/segmented-control.macos.tsrx` covers selection dispatch only;
it is not proof of OS keyboard navigation. Tab entry, focus appearance,
selection rendering, VoiceOver, native events and packaged behavior remain
open. The new `appkit-segmented-control` recipe records those gaps. Existing
motion recipes retain their web/iOS/Android target scope.

Additional commands deferred until human authorization:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/segmented-control-keys.macos.test.ts
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:macos --filter=@octane-xplat/ui
pnpm probe run examples/probes/segmented-control.macos.tsrx --target macos --watch
pnpm check:recipes
```

The probe uses direct dispatch. Separately exercise physical Tab, arrows,
Home/End, Enter/Space, live disable/reorder/unmount, two windows and VoiceOver
on an authorized AppKit host. No visual analysis is authorized.

Work continues in the isolated detached worktree
`/Users/alec/dev/alloc/worktrees/octane-xplat/appkit-support/octane-xplat`.
The 16 in-progress AppKit files were transferred and byte-verified; their
uncommitted copies were removed from the shared checkout. Commit `8ac8a11db`
remains in both histories. No dependencies were installed in the new worktree;
syntax parsing used the original checkout's existing parser read-only.

## Responsive layout and live host state

The AppKit root now selects a dedicated media-query hook. It subscribes to
primary-host-window resize notifications and evaluates width/height, pointer,
hover and orientation using desktop traits. Native queries share a pure
restricted evaluator; invalid pointer/hover/orientation values no longer match,
and `and` terms are evaluated before `or` alternatives. NativeScript retains
screen dimensions and touch traits. Arbitrary CSS, range syntax, secondary
window ownership and reduced-motion queries remain outside this hook.

The AppKit host installer used `Object.assign` on an object containing getters:
that evaluated `appState` and `windowSize` once rather than preserving live
reads. It now defines those descriptors on the existing renderer bridge. Window
sizes use content bounds before outer-window frames and preserve snapshot
identity until dimensions change. This is a source-confirmed prerequisite
repair; runtime state/resize delivery is not yet qualified.

Parser checks passed for the changed source and bridge regressions. No tests
have executed. The maintained `responsive-layout.macos.tsrx` probe is authored
but not run. Its programmatic resize does not establish physical pointer input
or pixel parity. The new responsive-layout recipe records the source subset.

Additional deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/media-query-native.test.ts src/media-query-source.macos.test.ts
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/platform --filter=@xplat/macos
pnpm probe run examples/probes/responsive-layout.macos.tsrx --target macos --watch
pnpm check:recipes
```

Once authorized, check app activation/deactivation, actual primary-window
resize/rendering and subscription cleanup in addition to bridge assertions.
Work is now on origin branch `feat/appkit-native-support`; pushing is authorized.
The heavy-verification restriction remains unchanged.
