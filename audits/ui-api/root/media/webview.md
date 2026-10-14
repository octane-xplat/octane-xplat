# WebView

Current exports: `WebView`.

**Design: Require one content source and expose a portable handle.**

src and html are both optional and may both be supplied; WebViewHandle also leaks native:any. Use a URI/HTML union and keep raw platform access on target-specific handles. State which sandbox and navigation policies are enforced per target rather than letting a browser-shaped prop imply a universal guarantee.

Proposed shape (illustrative):

```ts
type ProposedWebViewSource =
	{ src: string; html?: never } | { src?: never; html: string; baseUrl?: string }
```

Evidence: [src/props.ts:1147](../../../../packages/ui/src/props.ts#L1147), [src/props.ts:1178](../../../../packages/ui/src/props.ts#L1178).

[Audit index](../../README.md)
