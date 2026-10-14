# Selection indicators and their registry

Current exports: `CheckboxIndicator`, `CheckIndicator`, `RadioIndicator`, `defaultIndicators`, `getIndicator`, `registerIndicator`, `registerIndicators`, `useIndicator`, `indicatorScope`.

**Design: Give useIndicator reactive behavior or use only getIndicator.**

The implementation explicitly says useIndicator is not a reactive hook; it calls getIndicator without subscribing. Registration affects later reads but cannot itself refresh consumers. Keep decorative indicators distinct from inputs, preserve the useful typed family registry, and either subscribe to registry changes or make registration immutable after boot.

Proposed shape (illustrative):

```ts
type ProposedIndicatorRegistry<T> = {
	get(name: string): T | undefined
	register(name: string, indicator: T): void
	subscribe(listener: () => void): () => void
}
```

Evidence: [src/props.ts:7025](../../../../packages/ui/src/props.ts#L7025), [src/indicators.ts:20](../../../../packages/ui/src/indicators.ts#L20).

[Audit index](../../README.md)
