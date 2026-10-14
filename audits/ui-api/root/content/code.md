# Code, CodeBlock, and Blockquote

Current exports: `Code`, `CodeBlock`, `Blockquote`.

**Design: Keep these familiar display names and standardize content and copy events.**

CodeBlock.code is clear; its onCopy callback has no success result, while the clipboard utility returns one. Specify copy failure and line numbering explicitly, and use contentStyle-style names consistently for customization. Keep styling/decoration options separate from syntax data so agents do not recreate tokenization to change appearance.

Proposed shape (illustrative):

```ts
type ProposedCodeCopyEvents = {
	onCopy?: (result: { success: boolean; text: string }) => void
	onCopyError?: (error: unknown) => void
}
```

Evidence: [src/props.ts:6190](../../../../packages/ui/src/props.ts#L6190), [src/props.ts:6211](../../../../packages/ui/src/props.ts#L6211), [src/props.ts:6256](../../../../packages/ui/src/props.ts#L6256).

[Audit index](../../README.md)
