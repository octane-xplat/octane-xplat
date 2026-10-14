# Carousel, Lightbox, and useLightbox

Current exports: `Carousel`, `Lightbox`, `useLightbox`.

**Design: Keep the names and align slide selection, playback, and open-state conventions.**

Lightbox uses index/defaultIndex/onIndexChange and isOpen, while Carousel provides a separate imperative handle with no matching selection props. Use one index or stable-item-key contract, open/onOpenChange, loop, snap, and autoPlay. Explicit playback and zoom limits help agents build a gallery without guessing cross-platform support.

Proposed shape (illustrative):

```ts
type ProposedSlideSelection = {
	index?: number
	defaultIndex?: number
	onIndexChange?: (index: number) => void
}
```

Evidence: [src/props.ts:2188](../../../../packages/ui/src/props.ts#L2188), [src/props.ts:2200](../../../../packages/ui/src/props.ts#L2200), [src/props.ts:2250](../../../../packages/ui/src/props.ts#L2250).

[Audit index](../../README.md)
