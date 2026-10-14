# Focus hooks

Current exports: `useFocus`, `useFocusRing`, `useFocusVisible`, `isFocusVisible`, `useFocusWithin`.

**Fix: Keep focus-within semantics about the whole subtree.**

The native useFocusWithin treats one element focus/blur as subtree entry/exit, while the web leaf inspects relatedTarget. That approximation can falsely report leaving a group when focus moves between its children. Implement an actual group contract or expose a supported subset; normalize the optional unknown event payload and document modality support per target.

Proposed shape (illustrative):

```ts
type ProposedFocusState = {
	focused: boolean
	focusWithin: boolean
	focusVisible: boolean
	modality: 'keyboard' | 'pointer' | 'unknown'
}
```

Evidence: [src/use-focus.tsrx:1](../../../../packages/ui/src/use-focus.tsrx#L1), [src/use-focus-within.tsrx:1](../../../../packages/ui/src/use-focus-within.tsrx#L1).

[Audit index](../../README.md)
