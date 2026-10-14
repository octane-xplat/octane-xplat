# bottomSheetHost on the macOS root

Current exports: `bottomSheetHost`.

**Fix: Keep sheet-host lookup on an integration entrypoint.**

macOS uniquely exports bottomSheetHost at the root, and that leaf always returns null. The NativeScript helper belongs to host integration, not ordinary sheet invocation. Remove the accidental root export; keep app code on the declarative component or an instance handle with supported operations.

Proposed shape (illustrative):

```ts
type ProposedSheetIntegrationPolicy = {
	root: ['BottomSheet', 'openBottomSheet']
	hostLookup: 'platform integration only'
}
```

Evidence: [src/index.macos.ts:389](../../../../packages/ui/src/index.macos.ts#L389), [src/bottom-sheet-service.macos.ts:70](../../../../packages/ui/src/bottom-sheet-service.macos.ts#L70).

[Audit index](../../README.md)
