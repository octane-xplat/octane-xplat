# ChatToolCalls

Current exports: `ChatToolCalls`.

**Design: Give every tool call a stable ID and a discriminated execution state.**

key is optional, duration is a formatted string, and errors/results can accompany unrelated status values. Require id, use durationMs, and distinguish pending/running/succeeded/failed data. Keep rendered result detail separate from the backend payload so an agent can update a running call without reconstructing presentation text.

Proposed shape (illustrative):

```ts
type ProposedToolCallState =
	| { status: 'running'; startedAtMs: number }
	| { status: 'succeeded'; durationMs: number; result: unknown }
	| { status: 'failed'; error: string }
```

Evidence: [src/props.ts:4123](../../../../packages/ui/src/props.ts#L4123), [src/props.ts:4143](../../../../packages/ui/src/props.ts#L4143).

[Audit index](../../README.md)
