# useAsyncList

Current exports: `useAsyncList`.

**Design: Expose cancellation, completion, and pagination readiness.**

reload/loadMore/sort return void; callers can only inspect shared state later. Add a request lifecycle with cancel/dispose and observable completion, plus hasMore. The hook currently reloads on mount without an unmount cancellation path. Preserve AbortSignal loaders and fence stale async sort results as carefully as load results.

Proposed shape (illustrative):

```ts
type ProposedAsyncListControls = {
	reload(): Promise<void>
	loadMore(): Promise<void>
	cancel(): void
	readonly hasMore: boolean
}
```

Evidence: [src/async-list.ts:59](../../../../packages/ui/src/async-list.ts#L59), [src/use-async-list.tsx:16](../../../../packages/ui/src/use-async-list.tsx#L16).

[Audit index](../../README.md)
