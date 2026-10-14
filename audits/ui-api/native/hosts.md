# NativeScript host integration

Current exports: `rootLayoutFor`, `topRootLayout`, `findInRootLayouts`, `layoutsForRoute`, `bottomSheetHost`.

**Design: Name this entrypoint for NativeScript and keep host plumbing out of app-facing APIs.**

native is broader than the actual RootLayout and bottom-sheet host integration exposed here. Prefer a nativescript or internal host entrypoint, with typed host handles and lifecycle ownership. layoutsForRoute is also at the shared root; give it one canonical integration home so agents do not use internal routing/host lookups as normal navigation.

Proposed shape (illustrative):

```ts
type ProposedNativeScriptHostAccess<THost> = {
	getRootHost(): THost | null
	findHost(id: string): THost | null
}
```

Evidence: [src/native/index.ts:1](../../../packages/ui/src/native/index.ts#L1).

[Audit index](../README.md)
