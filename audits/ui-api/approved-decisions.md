# Approved API decisions

These decisions are approved for future implementation. Other audit recommendations remain pending review; approval does not mean the API has shipped.

## D1: Purpose-focused entrypoints

Approved by the user on 2026-10-14.

Keep one package with the following public entrypoints:

| Entrypoint                  | Owns                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `@octane-xplat/ui`          | General UI components, including ordinary forms, layout, and overlays |
| `@octane-xplat/ui/routing`  | Route definitions, navigation operations, and back handling           |
| `@octane-xplat/ui/data`     | Stores, collection data, and queries                                  |
| `@octane-xplat/ui/markdown` | Markdown rendering, parsing, and streaming                            |
| `@octane-xplat/ui/chat`     | Chat messages, composers, and conversation scrolling                  |

Each API has one canonical import path. Related components, hooks, and types stay together, and documentation and compiler diagnostics identify that path. Existing platform-specific boundaries remain explicit.

Approved entrypoint names; these imports are not available yet:

```ts
type ApprovedEntrypoint =
	| '@octane-xplat/ui'
	| '@octane-xplat/ui/routing'
	| '@octane-xplat/ui/data'
	| '@octane-xplat/ui/markdown'
	| '@octane-xplat/ui/chat'
```

Reasoning: these domains correspond to distinct implementation tasks, so an agent can infer where to look without inspecting the entire root barrel. Keep ordinary UI together because categories such as forms and overlays overlap. Separate packages would add installation and version coordination without being necessary for these boundaries.

Agent reliability is an unmeasured design hypothesis. Established frontend patterns are not evidence that a layout is optimal for agents. Compare the same implementation tasks against both designs, counting incorrect imports, invented APIs, and repair attempts, before claiming a measured improvement.

## D2: Truthful platform contracts

Approved on 2026-10-14. Every accepted prop and operation must deliver its documented behavior on the target. A shared entrypoint exposes the same intended names and types across targets. Where behavior is unavailable, expose an explicit supported subset, capability result, or failure instead of silently accepting a no-op.

Reasoning: an agent can produce code that compiles yet does nothing when export names and prop types overstate platform support. A truthful contract makes the unsupported path discoverable and repairable.

## D3: Consistent state and events

Approved on 2026-10-14. Give each state dimension one coherent controlled-value, initial-value, and change-notification contract. Remove competing state aliases and duplicate action paths. Define callback payloads, pending behavior, and failure reporting. Resolve the actual public spellings through D6.

Illustrative state roles; these are not approved prop spellings:

```ts
type StateContract<T> = {
	controlledValue?: T
	initialValue?: T
	changeNotification?: (value: T) => void
}
```

Reasoning: predictable ownership and callback behavior let an agent compose controls without learning a new state model for each component. Consistency should preserve the preferred reference vocabulary rather than introduce generic replacement names.

## D4: Reject contradictory configurations through types

Approved on 2026-10-14. Use discriminated unions and constrained types when a mode determines the allowed value, fields, or callback payload. Keep single and multiple selection precise, and make menu entry kinds determine their valid fields.

Illustrative invariant:

```ts
type SelectionState =
	{ mode: 'single'; value: string | null } | { mode: 'multiple'; value: readonly string[] }
```

Reasoning: the compiler should catch invalid combinations before execution. Broad independent unions allow plausible-looking generated code to pass checks while expressing an impossible configuration.

## D5: Useful public types

Approved on 2026-10-14. Replace unnecessary public `any` with useful contracts, prioritizing component props, collection items, refs, handles, and callback payloads. Export the types consumers need, align their names with their owning APIs, and keep platform escape hatches explicit.

Reasoning: precise types provide actionable feedback for an agent's repair loop. Permissive types hide misspellings and mistaken assumptions; useful types describe supported choices without exposing implementation bookkeeping.

## D6: Naming precedence

Approved on 2026-10-14. Prefer naming from **Astryx → React Aria → React Native → generic frontend**, in that order, for comparable public concepts. Apply this order to components, props, events, hooks, and related public types. Choose a semantically equivalent reference; fall through when no comparable API exists. Keep related names mechanically consistent, such as `Component` and `ComponentProps`.

```ts
type NamingPrecedence = readonly ['Astryx', 'React Aria', 'React Native', 'generic frontend']
```

Reasoning: this provides a deterministic vocabulary for framework development. Generic familiarity alone is not a reason to rename an Astryx-aligned API. This replaces the audit's earlier preference for generic names such as Checkbox, Select, and TagInput where a higher-priority equivalent exists.

These approvals establish directions and invariants. They do not approve every individual rename or illustrative prop spelling in the audit. Resolve those against D6 during implementation review. [Candidate framework principles](principles.md) turn these decisions into proposed development guidelines; they have not been added to `AGENTS.md`.

[Audit index](README.md)
