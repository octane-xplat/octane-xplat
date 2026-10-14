# Platform support contracts

**Fix: Make unsupported behavior visible before an agent chooses an API.**

Identical prop shapes currently hide different behavior: native FocusScope has inert focus flags and useGridList returns an inert prop bag. Either implement the promised behavior or expose an explicit platform subset. Capability results suit optional services; core interaction requirements should fail clearly rather than silently disappear.

Proposed shape (illustrative):

```ts
type ProposedCapability<T> = { supported: true; value: T } | { supported: false; reason: string }
```

**Design: Publish one compact support contract alongside each public concept.**

Distinguish portable guarantees, target-specific options, and unsupported features in generated API metadata. This lets agents choose a supported implementation without reading native leaves. A matching export name alone should never count as behavioral parity.

Proposed shape (illustrative):

```ts
type ProposedSupport = {
	targets: readonly string[]
	guarantees: readonly string[]
	limitations: readonly string[]
}
```

Evidence: [src/FocusScope.tsrx:7](../../../../packages/ui/src/FocusScope.tsrx#L7), [src/use-grid-list.tsrx:4](../../../../packages/ui/src/use-grid-list.tsrx#L4), [src/useSpeechRecognition.tsrx:8](../../../../packages/ui/src/useSpeechRecognition.tsrx#L8).

[Audit index](../../README.md)
