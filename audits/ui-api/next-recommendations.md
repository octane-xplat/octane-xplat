# Further API recommendations

Recommended design directions. These extend the approved directions with concrete ways to reduce agent guesses and repair work. Expected usability benefits are design hypotheses, not benchmark results. Names in the shapes below remain subject to Astryx → React Aria → React Native → generic frontend.

## R1: Consistent composition and named render contexts

Use consistent slot roles and render-context shapes within related component families. Prefer a named context object when a render callback needs several arguments. Keep structural requirements explicit instead of making consumers infer which children, slots, or context providers are required.

```ts
type RenderItemContext<T> = {
	item: T
	index: number
	isSelected: boolean
	isDisabled: boolean
}
type RenderItem<T, Content> = (context: RenderItemContext<T>) => Content
```

Reason: an agent can discover named fields through types instead of remembering positional argument order. Consistent slot roles also make adapting an existing example to another component easier. Avoid forcing unrelated components into an oversized universal context. ComplexSelector currently has four positional children arguments; row and card APIs use different anatomy vocabularies. See [ComplexSelector](root/forms/complex-selector.md) and [content rows](root/collections/item-list.md).

## R2: Return handles that own one resource instance

Imperative APIs that create a surface or long-lived resource should return a typed instance handle. Define readiness, completion, cancellation, and cleanup on that instance, with idempotent disposal where appropriate. Prefer closing the owned instance to a global close operation.

```ts
type SurfaceHandle<Result> = {
	readonly id: string
	readonly result: Promise<Result | null>
	close(result?: Result): void
	dispose(): void
}
```

Reason: after an asynchronous step, an agent should still know which sheet, toast, window, or subscription it is affecting. Scoped handles reduce accidental interference between concurrent instances and make cleanup discoverable. Lifecycle details must distinguish normal closing from cancellation/disposal. See [bottom sheets](root/overlays/bottom-sheet.md), [toasts](root/overlays/toast.md), and [windows](root/navigation/windows.md).

## R3: Declare schemas once and preserve inference through consuming APIs

Let route definitions, filter configurations, and collection schemas determine the types accepted by their consumers. Preserve literal keys and inferred relationships through helpers; avoid asking the author to maintain a second parameter or value map.

```ts
type RouteParameters = {
	detail: { id: string }
	settings: Record<string, never>
}
type Navigate<Parameters> = <Name extends keyof Parameters>(
	name: Name,
	params: Parameters[Name],
) => Promise<void>
```

Reason: this prevents an agent from inventing route parameters, filter operators, or column keys that look plausible but disagree with the definition. Type precision must survive the whole authoring-to-consumption path, not stop at the schema builder. Keep complex inference behind simple authoring helpers. See [route definitions](root/navigation/route-definitions.md), [routing](root/navigation/routes.md), [PowerSearch](root/forms/power-search.md), and [Table](root/collections/table.md).

## R4: Make declarative updates and prop removal predictable

Treat shared component props as the current render's state, with explicit defaults and clearing semantics. Removing an optional prop should restore its documented default rather than preserve an earlier host value. Keep intentional patch operations separately named and documented.

Proposed normalization, not current renderer behavior:

```ts
type PositionProps = { left?: number }
const next: PositionProps = {}
const normalized = { left: next.left ?? 0 } // Proposed default: zero.
```

Reason: agents often edit code by removing a prop. Hidden retained state makes a correct-looking edit behave differently across targets and is hard to diagnose from types. The current [implementation guidance](../../.agents/docs/architecture.md) says native non-event prop updates merge and omitted props retain their previous value. Specify omission, undefined, null, and explicit reset behavior per contract; do not impose one clearing sentinel on every value type.

## R5: Make runtime diagnostics usable as repair instructions

For contract failures that escape static checks, report stable diagnostic codes with the API, offending field path, expected shape, and a concrete repair hint. Include missing providers and initialization requirements. Avoid silently accepting invalid configuration or merely logging a warning and choosing an arbitrary interpretation.

```ts
type ApiDiagnostic = {
	code: 'INVALID_CONFIGURATION' | 'MISSING_PROVIDER'
	api: string
	fieldPath?: readonly string[]
	expected: string
	receivedKind?: string
	hint: string
}
```

Reason: a structured failure tells an agent what to change and can be surfaced consistently by development tools. Static types cannot validate arbitrary JavaScript, loaded configuration, or runtime prerequisites. Keep diagnostics concise and avoid exposing private input values. Route definitions currently warn on duplicate names and keep the later definition; see [route definitions](root/navigation/route-definitions.md).

[Candidate principles P8–P12](principles.md#additional-design-principles) · [Audit index](README.md)
