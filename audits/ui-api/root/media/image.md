# Image

Current exports: `Image`.

**Design: Keep src/alt and make source and accessibility alternatives precise.**

ImageSourceLike arrays, placeholder, and recyclingKey describe different concerns in one source contract. Distinguish a URI from responsive candidates, define source dimensions and units, and require either alt or decorative:true. Keep contentFit/contentPosition if those are the portable terms, but document their exact mapping rather than implying all CSS object-position values work.

Proposed shape (illustrative):

```ts
type ProposedImageAccessibility =
	{ alt: string; decorative?: false } | { alt?: never; decorative: true }
```

Evidence: [src/props.ts:1284](../../../../packages/ui/src/props.ts#L1284).

[Audit index](../../README.md)
