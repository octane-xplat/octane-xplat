# Windows raw key-event repair

`key-events.windows.ts` owns the new module's TypeScript source. Its ES2021
JavaScript and declaration are included in the canonical preview-core patch at
`packages/cli/patches/@nativescript__core@9.1.4-next.0.patch`.
`view-integration.patch` records the delta from the previously retained published
Windows files: View lifecycle, subscriber priority, and TextField submit
cancellation. It is a published-file delta, not a claim that an upstream source
checkout has adopted the repair. The preview pin is NativeScript `abae298`.

The view acquires KeyDown/KeyUp only while loaded and observed, using the existing
subscriber dispatcher. Removal, unload, disposal and native replacement retire
callbacks; disposal cannot reattach them from a late notification. Raw callbacks
run before submit regardless of registration order. Only explicit bridge
consumption suppresses returnPress, leaving legacy native Handled behavior alone.
Ordinary subscribers retain priority zero and their existing order.

The bridge emits core EventData with nativeEvent and preventDefault. It does not
normalize key names, physical codes, modifiers or composition state, and it does
not enable the public useKeyboard hook. Real WinUI/OS input, handled/routed keys,
IME and modal focus still need qualification. See the
[Windows progress note](../../../../.agents/docs/parity/windows-support-progress.md).

The maintained `@xplat/windows#test:keyboard` task evaluates the published helper
and extracted View/TextField methods against fake native/core objects, plus the
retained pointer suite. By default it resolves installed patched core. Set
`WINDOWS_CORE_ARTIFACT` to a private extracted core directory to check a candidate
without modifying any installed dependency. It is not an app/WinRT test.

```sh
bun run turbo run test:keyboard --filter=@xplat/windows
```
