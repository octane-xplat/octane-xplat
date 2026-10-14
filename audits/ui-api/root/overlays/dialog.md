# Dialog, AlertDialog, and imperative dialog hooks

Current exports: `Dialog`, `DialogHeader`, `useImperativeDialog`, `AlertDialog`, `useImperativeAlertDialog`.

**Design: Use open/onOpenChange and one explicit dismissal contract.**

Dialog and AlertDialog require isOpen, unlike Popover.open. Normalize the name and expose the dismissal reason when it affects confirmation or unsaved changes. DialogHeader should supply accessible title/description association, and AlertDialog should make confirmation failures observable rather than only accepting a loading flag.

Proposed shape (illustrative):

```ts
type ProposedDialogDismissReason = 'escape' | 'backdrop' | 'back' | 'action'
type ProposedDialogState = {
	open: boolean
	onOpenChange(open: boolean, reason?: ProposedDialogDismissReason): void
}
```

**Design: Keep declarative and imperative dialogs on the same options and lifecycle.**

The hooks return show/hide/isOpen/element, creating another vocabulary for the same concept. Prefer open/close and a typed render result. Define mount ownership, focus restoration, and cleanup once so agents can switch invocation style without changing the actual dialog contract.

Proposed shape (illustrative):

```ts
type ProposedDialogController<TOptions> = {
	open(options: TOptions): void
	close(): void
	isOpen: boolean
}
```

Evidence: [src/props.ts:2071](../../../../packages/ui/src/props.ts#L2071), [src/props.ts:2134](../../../../packages/ui/src/props.ts#L2134), [src/props.ts:2146](../../../../packages/ui/src/props.ts#L2146).

[Audit index](../../README.md)
