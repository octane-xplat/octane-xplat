# Own native AppKit window sheets from the declaring tree

ID: appkit-native-sheet
Targets: macos
Related APIs: AppKitSheet, AppKitSheetProps

## Starting point

Editing records and confirming document actions are common application flows.
The retained demo claimed sheets were unsupported although the package already
portaled to an AppKit window. Source review found captured callbacks, missing
controlled-close reporting, unsafe close/delegate ownership and a parentless
floating fallback. Reuse `beginSheet` and the existing portal bridge. The shared
surface engine deliberately renders inside a window and is not a substitute
for an authentic window sheet. None of these findings is native runtime proof.

## Acceptance criteria

- AC1: Prepare a current portal/native session; show only after portal commit. Callback/content updates preserve the session and use current callbacks. Native dismissal or accepted/queued controlled close reports once; a still-true open request does not reopen. Retire before cleanup, ignoring stale/reentrant callbacks; unmount/id/view replacement and pre-presentation cancellation are silent. Missing/throwing preparation and native failure drop the portal and show a generic retryable message.
- AC2: Wait for actual window attachment using an owned hidden native child; pin the parent after attachment and never create a floating fallback. Preserve AppKit queueing. Observe parent/sheet close, end only the owned session on cancel/parent loss/teardown, and retire observers/selector callbacks before native cleanup. Clean partial failures, fit finite content with native minima, expose exact responder/window selectors with existing registration and preserve the native responder chain for cancellation.
- AC3: Replace the stale demo with controlled form/provider updates, callback/id replacement, queued/cancelled/nested sheets, initial-open mount and explicit delayed owner removal. Reuse it in an idle probe. Author seven owner-model, eight native controller-model and two actual renderer-factory cases, all unrun; fake dispatch does not qualify OS input, layout, provider/hook behavior or native queueing/cancellation.
- AC4: Reconcile public guide, README, public type comments, skill, breaking feature note and target progress. Record exact deferred commands and unavailable standalone docs/demo tasks. Distinguish source from runtime, leave qualification gates open, and record coverage separately from verification.

## Documentation

- AC1–AC4: [Native lifecycle](../../../docs/platform/sheet.md#native-macos-window-sheets), [README](../../../packages/sheet/README.md#native-macos-window-sheets), Octane overlays reference and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-native-window-sheet-ownership).
- AC1: [Owner-model cases](../../../packages/sheet/tests/sheet-owner.macos.test.mjs), authored but unrun.
- AC2: [Native controller-model cases](../../../packages/macos-renderer/test/sheet.test.ts) and [actual renderer factory cases](../../../packages/macos-renderer/test/sheet-native-bridge.test.ts), authored but unrun. The factory cases exercise the actual classes/bridge against fakes, not the ObjC ABI.
- AC3: [Maintained demo](../../../packages/demos/src/NativeSheetDemo.macos.tsrx) and [idle probe](../../../examples/probes/native-sheet.macos.tsrx), authored but unrun. No sheet/input action runs automatically.
