# openWindow

Current exports: `openWindow`.

**Fix: Use one observable result and distinguish app windows from external URLs.**

The web leaf returns Window | null and ignores data; the native leaf returns void and passes app-owned data. Those are different public contracts behind one name. Return a portable handle or a discriminated result, expose unsupported payload behavior, and separate opening app content from opening a URL.

Proposed shape (illustrative):

```ts
type ProposedOpenWindowResult =
	{ opened: true; close(): void } | { opened: false; reason: 'unsupported' | 'blocked' | 'failed' }
```

Evidence: [src/props.ts:2699](../../../../packages/ui/src/props.ts#L2699), [src/windows.web.ts:3](../../../../packages/ui/src/windows.web.ts#L3), [src/windows.ts:4](../../../../packages/ui/src/windows.ts#L4).

[Audit index](../../README.md)
