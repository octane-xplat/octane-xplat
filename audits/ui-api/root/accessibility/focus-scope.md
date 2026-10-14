# FocusScope

Current exports: `FocusScope`.

**Fix: Honor focus control props or remove them from unsupported targets.**

The native leaf explicitly leaves contain, restoreFocus, and autoFocus inert. These names request behavior, not decoration, and an agent building a dialog will reasonably rely on them. Provide supported focus management or an explicit web-only entrypoint; a silent plain-container fallback is not an equivalent contract.

Proposed shape (illustrative):

```ts
type ProposedFocusScopeSupport = {
	containment: boolean
	restoration: boolean
	autoFocus: boolean
}
```

Evidence: [src/props.ts:6789](../../../../packages/ui/src/props.ts#L6789), [src/FocusScope.tsrx:7](../../../../packages/ui/src/FocusScope.tsrx#L7).

[Audit index](../../README.md)
