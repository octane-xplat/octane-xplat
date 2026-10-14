# Candidate framework development principles

These are candidates for the framework's `AGENTS.md` or similar development guidance, and have not been installed as framework instructions. P1–P7 are grounded in the [approved API decisions](approved-decisions.md). P8–P17 extend those decisions using the audit findings. These documents use the reviewer’s judgment as authorized; individual API changes remain recommendations until implemented. Keep this document current as the audit produces new principles.

## P1: Organize public APIs by coherent purpose

Give each API one canonical import path. Keep related components, hooks, and types together. Split independent systems by the task they serve; keep overlapping general UI concepts together.

Reason: clear ownership reduces import ambiguity and makes discovery local to the task. More entrypoints help only when their boundaries are easy to infer. Derived from D1.

## P2: Public contracts must be truthful

Accept a prop or operation only when its documented behavior is supported. Keep the intended shared export surface consistent across targets. Expose unsupported behavior as an explicit subset, capability, or failure.

Reason: successful typechecking must not conceal a missing implementation. Agents need an observable limitation before they can select a supported alternative. Derived from D2.

## P3: Make state ownership and events predictable

Use one coherent controlled, initial, and change-notification model for each state dimension. State which combinations are legal and who owns updates. Avoid competing aliases and duplicate action paths. Specify payloads, asynchronous pending behavior, and failures; choose spellings using P6.

Reason: a reusable state model reduces special cases when composing components. Explicit action outcomes prevent a failed operation from appearing successful. Derived from D3.

## P4: Make invalid configurations fail at the type boundary

Use discriminated unions and constrained types for mode-dependent values, fields, and callbacks. Prefer a supported default path with few required choices. Make advanced modes explicit rather than accumulating independent flags.

Reason: fewer independent choices reduce the number of configurations an agent must consider. Compiler errors are useful repair instructions. Accepting every plausible combination moves mistakes into harder-to-diagnose runtime behavior. Derived from D4.

## P5: Public types should guide implementation and repair

Publish precise, consumer-facing props, item types, events, refs, and handles. Avoid unnecessary `any`, untyped host access, and implementation fields. Give intentional escape hatches a clearly bounded contract.

Reason: agents can verify and correct code when types express real supported choices. Internal details and permissive bags weaken that feedback. Derived from D5.

## P6: Choose names through a fixed reference order

Prefer **Astryx → React Aria → React Native → generic frontend** for semantically comparable components, props, events, hooks, and types. Fall through only when the higher-priority source has no comparable API. Keep names within each family consistent and preserve their semantic meaning.

Reason: a fixed order prevents ad hoc renames driven by an individual preference or generic familiarity. A reference name is useful only when it describes the contract actually offered. Derived from D6.

## P7: Distinguish usability hypotheses from measured results

Evaluate agent usability with representative implementation tasks and observable mistakes: incorrect imports, invented APIs, and repair attempts. Treat existing ecosystem patterns as design references rather than proof of agent reliability.

Reason: a familiar pattern may help, but its age or popularity does not establish that it works best for agents. Derived from D1's evaluation rationale.

## Additional design principles

### P8: Make composition contexts discoverable

Use consistent slot roles and named render-context fields within related API families. State required structure and providers explicitly. Make accessible naming, focus, keyboard behavior, and state propagation part of the composed contract.

Reason: agents can inspect fields and adapt examples without remembering a different positional or structural convention for each component. See the composition recommendations in [recommended changes](recommended-changes.md#then-make-composition-and-operations-reliable).

### P9: Give created resources explicit instance ownership

Return typed instance handles from imperative resource-creating operations. Define readiness, completion, cancellation, and cleanup; make disposal idempotent where appropriate. Specify whether retries create a new instance or affect an existing one.

Reason: explicit ownership prevents delayed actions from affecting the wrong concurrent instance and makes lifecycle obligations visible. See [recommended changes](recommended-changes.md).

### P10: Preserve schema relationships end to end

Derive consuming API types from one authoritative definition. Preserve literal keys and inferred relationships through builders, helpers, and execution methods.

Reason: duplicated declarations drift, and widened types lose the compiler feedback needed to repair invented keys or incompatible values. See [recommended changes](recommended-changes.md).

### P11: Declarative renders describe current state

Define consistent default, omission, and clearing behavior for shared props. Restore defaults when optional props are removed; reserve merging behavior for explicitly documented patch operations.

Reason: hidden retained host state makes source edits misleading and introduces cross-platform differences that types cannot reveal. See [recommended changes](recommended-changes.md).

### P12: Diagnostics should identify a repair

Report actionable runtime contract failures with stable codes, field paths, expected shapes, and repair hints. Distinguish invalid input, unsupported capabilities, cancellation, and operational failure. Make prerequisites such as required providers discoverable before invocation.

Reason: clear diagnostic contracts turn failures into useful feedback rather than forcing an agent to inspect framework internals. See [recommended changes](recommended-changes.md).

### P13: Make units, identity, and empty values explicit

Give related APIs the same meaning for numeric units, keys, and empty values. Separate layout units from spacing tokens, instants from local dates, and positions from stable identity. Specify clearing per value family rather than guessing from magnitude or truthiness.

Reason: plausible values can typecheck while expressing the wrong meaning. Explicit domains make reuse between components safer and prevent silent reinterpretation. See [time](../../packages/ui/src/props.ts#L6440), [Stack](../../packages/ui/src/props.ts#L120), and [date inputs](../../packages/ui/src/props.ts#L602).

### P14: Separate snapshots, subscriptions, and mutations

Make reactive reads distinguishable from one-time reads. Expose readonly snapshots and explicit mutation operations; define selector equality and initialization behavior. Preserve the framework’s signal-backed `$` convention.

Reason: an agent should not need hidden knowledge about which reads subscribe or which mutations notify. Types should discourage modifications that bypass the state owner. See [stores](../../packages/ui/src/store.ts#L16) and [collection data](../../packages/ui/src/list-data.ts#L12).

### P15: Make asynchronous outcomes and ordering observable

Expose completion and failure for asynchronous actions. State cancellation, concurrent invocation, stale-result, and retry behavior. Model pending, success, and failure as meaningful states; reserve silent no-ops for explicitly documented optional operations.

Reason: agents need to determine whether an action succeeded and whether it is safe to repeat. An operation that returns before completion or discards failures defeats that feedback. See [async lists](../../packages/ui/src/async-list.ts#L59), [Button](../../packages/ui/src/props.ts#L2744), and [query caching](../../packages/ui/src/query-cache.ts#L55).

### P16: Make the preferred path discoverable from the public contract

Keep declarations and symbol documentation sufficient to find the canonical import, required prerequisites, defaults, units, errors, and related APIs. Show a minimal supported composition and one meaningful failure case. Keep experimental proposals distinct from current supported instructions.

Reason: agents often work from a small slice of context. The contract should answer the immediate question without requiring private source inspection or a large custom instruction file. See [public props](../../packages/ui/src/props.ts#L318) and [imports](../../packages/ui/package.json#L40).

### P17: Make configuration scope and precedence explicit

Keep reusable components independent of unrelated systems. Bind configurable routing, caches, registries, and services to a visible application or instance scope. Define parent/child defaults and override precedence. Prefer a usable standard setup; introduce providers only when they own meaningful shared configuration or lifecycle.

Reason: hidden global configuration makes one consumer affect another and forces agents to reason beyond the edited component. Explicit scope allows safe reuse; unnecessary providers add setup and failure points. See [routing](../../packages/ui/src/props.ts#L2349), [query caching](../../packages/ui/src/query-cache.ts#L55), [icons](../../packages/ui/src/props.ts#L1434), and [ButtonGroup](../../packages/ui/src/props.ts#L5491).

## Applying these principles

Use these criteria when designing or changing an API; do not add a new option merely to satisfy a checklist. Prefer fewer concepts with precise contracts over many aliases or a universal abstraction. Keep reference semantics when choosing reference names. A breaking simplification is appropriate when it materially improves the contract, with migration guidance for existing users.

Evaluate proposed changes with bounded tasks: compose a field, select rows, navigate with parameters, open and close concurrent surfaces, clear a prop, and recover from an async failure. Compare successful completion, invented APIs, wrong imports, type errors, and repair attempts under equivalent prompts and context. Check supported targets separately. Keep changes that improve correctness or demonstrated usability; revise abstractions that increase setup or confusion. No such comparison has been run for this audit.

[Whole-package vision](package-vision.md) · [Concrete recommended changes](recommended-changes.md) · [Audit index](README.md)
