# UIModal and openModal

Current exports: `UIModal`, `openModal`.

**Design: Keep native presentation distinct and share typed modal results with dialogs.**

openModal is only available on platform subpaths, which is a useful boundary. Give its options and result meaningful types, require an accessible title/label where needed, and return a handle for the opened instance. Align open/close and focus ownership with the shared dialog/sheet conventions.

Proposed shape (illustrative):

```ts
type ProposedModalHandle<T> = {
	result: Promise<T | null>
	close(result?: T): void
}
```

Evidence: [src/ios/index.ts:13](../../../packages/ui/src/ios/index.ts#L13), [src/props.ts:1913](../../../packages/ui/src/props.ts#L1913).

[Audit index](../README.md)
