# MaterialDialog and openModal

Current exports: `MaterialDialog`, `openModal`.

**Design: Use the shared dialog vocabulary and a typed per-instance result.**

The platform name identifies OS presentation well. Keep it, but expose MaterialDialogProps rather than generic ModalProps and align action/cancel/result semantics with AlertDialog. Return a handle for imperative opens so multiple surfaces do not depend on a global closing convention.

Proposed shape (illustrative):

```ts
type ProposedMaterialDialogHandle<T> = {
	result: Promise<T | null>
	close(result?: T): void
}
```

Evidence: [src/android/index.ts:13](../../../packages/ui/src/android/index.ts#L13), [src/props.ts:1913](../../../packages/ui/src/props.ts#L1913).

[Audit index](../README.md)
