# Timestamp and Timer

Current exports: `Timestamp`, `Timer`.

**Fix: Use one explicit time unit and stop guessing from numeric magnitude.**

Timestamp accepts seconds or milliseconds based on a >1e12 heuristic, while Timer.startTime uses milliseconds. That inference misreads legitimate historical or far-future values. Prefer epoch milliseconds everywhere or a tagged timestamp; name thresholds with their units and distinguish instants from elapsed durations.

Proposed shape (illustrative):

```ts
type ProposedTimestampInput = { iso: string } | { epochMilliseconds: number }
type ProposedTimerProps = { startTimeMs?: number }
```

Evidence: [src/props.ts:6440](../../../../packages/ui/src/props.ts#L6440), [src/props.ts:6485](../../../../packages/ui/src/props.ts#L6485).

[Audit index](../../README.md)
