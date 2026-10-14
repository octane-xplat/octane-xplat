# Conditional root exports

**Fix: Generate every root barrel from one intentional public surface.**

macOS adds CameraView and bottomSheetHost, exports extra props through export type *, and omits SyntaxTokenType. Linux adds LinuxWindowHandle. For example, ButtonVariant and TextInputHandle are directly importable on macOS but not the shared web/mobile surface. Agents should not discover a different root API by changing build conditions; expose intentional platform types on explicit subpaths.

Proposed shape (illustrative):

```ts
type ProposedRootSurfaceRule = {
	sharedValuesAndTypes: 'identical across conditions'
	platformOnlyValuesAndTypes: 'explicit platform subpaths'
}
```

Evidence: [src/index.macos.ts:249](../../../../packages/ui/src/index.macos.ts#L249), [src/index.macos.ts:425](../../../../packages/ui/src/index.macos.ts#L425), [src/index.linux.ts:8](../../../../packages/ui/src/index.linux.ts#L8).

[Audit index](../../README.md)
