# copyText and useClipboard

Current exports: `copyText`, `useClipboard`.

**Design: Use text-specific naming and preserve the copy result.**

useClipboard.getItems actually returns a string and its press handler discards copyText success. Prefer getText and onCopyResult, or a clearly named useCopyText hook. Keep copyText as the simple promise-returning operation; richer clipboard formats deserve their own contract rather than a misleading plural items name.

Proposed shape (illustrative):

```ts
type ProposedCopyTextOptions = {
	getText(): string
	onCopyResult?: (success: boolean) => void
}
```

Evidence: [src/use-clipboard.ts:1](../../../../packages/ui/src/use-clipboard.ts#L1), [src/clipboard-write.web.ts:1](../../../../packages/ui/src/clipboard-write.web.ts#L1).

[Audit index](../../README.md)
