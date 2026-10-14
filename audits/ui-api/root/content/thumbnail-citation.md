# Thumbnail and Citation

Current exports: `Thumbnail`, `Citation`.

**Design: Make decorative, removable, and linked content explicit.**

Thumbnail mixes alt, label, remove, and press behavior; CitationSource allows every identifying field to be omitted. Require a meaningful citation title or URL, use imageSrc instead of ambiguous src, and keep accessible naming separate from visible labels. Define a keyboard/touch removal path when hover removal is selected.

Proposed shape (illustrative):

```ts
type ProposedCitationSource =
	| { title: string; url?: string; imageSrc?: string }
	| { title?: string; url: string; imageSrc?: string }
```

Evidence: [src/props.ts:6587](../../../../packages/ui/src/props.ts#L6587), [src/props.ts:6508](../../../../packages/ui/src/props.ts#L6508).

[Audit index](../../README.md)
