# styled

Current exports: `styled`.

**Design: Support typed enumerated variants or use a narrower factory name.**

styled currently interprets every variant prop as boolean. Agents familiar with variant factories will naturally try size="sm" or variant="primary" and get an incompatible API. Prefer typed option maps with defaults and compound variants only if needed; otherwise call this withClasses and clearly preserve its boolean-only contract.

Proposed shape (illustrative):

```ts
type ProposedVariantOptions = {
	size: 'sm' | 'md' | 'lg'
	tone: 'neutral' | 'accent'
	outlined: boolean
}
```

Evidence: [src/styled.web.tsrx:5](../../../../packages/ui/src/styled.web.tsrx#L5).

[Audit index](../../README.md)
