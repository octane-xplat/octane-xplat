# Keep AppKit provider-button actions with their mounted owner

ID: appkit-auth-button-actions
Targets: macos
Related APIs: AppleSignInButton, GoogleSignInButton, appleAuth, googleAuth

## Starting point

AuthDemo exposes both provider buttons. Their old async callbacks could reach
retired components and repeated activation could report overlap errors for a
still-pending attempt. Google's gesture container did not use native NSButton
actions. The renderer also ignored the shared intrinsic isEnabled spelling.
These are source findings, not observed native input/sign-in failures.

## Requirements

Keep each mounted AppKit provider sign-in button's pending action owned by that
button across presses, errors and teardown, without cancelling provider work or
reaching retired components.

## Acceptance criteria

- AC1: Each mounted AppKit provider button owns one pending action. Read current props, ignore disabled/pending/reentrant presses, and recheck observed owner/disabled state after onPress without treating its return as a gate. Keep current onResult ownership through prop/style changes and while disabled; retire it on unmount/replacement without cancelling provider work.
- AC2: Consume unexpected provider throws/rejections into one generic owned error without native exception detail. Consumer onPress errors propagate and release the claim; onResult errors are not reclassified as provider errors. A completed callback may start a fresh attempt; stale settlement cannot clear a replacement's claim.
- AC3: Google uses native NSButton through existing text/isEnabled/onPress intrinsics without a new dependency. Renderer isEnabled controls native state, respects an independent enabled alias and clears back to default; action dispatch rejects disabled/retired roots. Apple retains its official native button, with per-attachment cleanup so theme/type replacement cannot detach or activate a new owner accidentally.
- AC4: Maintain six action-model and three renderer branch cases plus an idle lifecycle fixture. Reconcile README/skill/fix note, exact deferred commands and limits: queued UI changes, no automatic busy indicator, noncancelled native work, unimplemented Google theme/variant, and native hook/attachment/keyboard/AX/layout/consumer qualification.

## Documentation

- AC1: [Button guide](../../../packages/auth/README.md#appkit-button-action-ownership), Octane services reference, fix note, [action model](../../../packages/auth/tests/button-action.macos.test.mjs) and [target note](../exploration.md#operational-evidence).
- AC2: The same [button guide](../../../packages/auth/README.md#appkit-button-action-ownership) and [action model](../../../packages/auth/tests/button-action.macos.test.mjs) cover owned errors, reentry and stale settlement.
- AC3: The same [button guide](../../../packages/auth/README.md#appkit-button-action-ownership), plus [native renderer branch cases](../../../packages/macos-renderer/test/button-state.test.ts) and [manual fixture](../../../examples/probes/auth-buttons.macos.tsrx). Direct branch dispatch is not native keyboard or AX input proof.
- AC4: The same [button guide](../../../packages/auth/README.md#appkit-button-action-ownership), [action model](../../../packages/auth/tests/button-action.macos.test.mjs), [renderer branch cases](../../../packages/macos-renderer/test/button-state.test.ts), [manual fixture](../../../examples/probes/auth-buttons.macos.tsrx) and [target note](../exploration.md#operational-evidence). Direct branch dispatch is not native keyboard or AX input proof.
