# Native styled factory and shared JSX types

Status: resolved at the declaration level — `ElementTypeOf` in
`packages/jsx/src/shared.d.ts` now accepts `(props, scope)` callables, so
two-parameter components compile under the shared facade. Native runtime
behavior was not exercised: rendering a factory result or provider on a
device/simulator is still unqualified.

`packages/ui/src/internal/layout/styled.tsrx` returns the result of
`defineUniversalComponent`. Its emitted declaration in
`types/generated/styled.d.ts` requires `(props, context)`, and the shared
JSX facade's `ElementTypeOf` previously accepted only a single-prop callable.
With `jsxImportSource: "@octane-xplat/jsx"`, rendering the factory result as
a JSX component produced TS2786. The web factory emits a single-prop
callable, so do not generalize this finding to the DOM renderer.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { styled, Pressable } from '@octane-xplat/ui'

const DangerButton = styled(Pressable, { variants: { danger: 'bg-danger' } })
// Compiled TS2786 before the facade accepted (props, scope); now compiles.
export function Example() {
	return <DangerButton danger />
}
```

For a consumer that needs to compile under the shared facade, compose CSS
classes directly on the shared component. No runtime/type implementation was
changed as part of the skill correction, and no cast is recommended.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'

export function Remove() {
	return (
		<Pressable className="trip-button bg-danger">
			<Text>Remove</Text>
		</Pressable>
	)
}
```

A remaining follow-up is to qualify factory rendering on the intended
renderers — declaration acceptance alone does not establish native runtime
behavior. The facade still rejects arbitrary signatures: prop types are
checked and non-callable values remain non-components.

## Context providers

The shared facade previously rejected Octane `Context<T>` as a JSX tag
because its callable declaration requires `(props, scope)`; the widened
`ElementTypeOf` now accepts providers. A provider remains a supported
runtime construct; the prior finding was limited to the shared native JSX
types. Do not infer that provider-based runtime ownership was unavailable.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { createContext } from 'octane'
import { Text } from '@octane-xplat/ui'

const Account = createContext('Guest')
export function Example() {
	// Compiled TS2786 before the facade accepted (props, scope); now compiles.
	return (
		<Account value="Avery">
			<Text>Home</Text>
		</Account>
	)
}
```

Provider examples in the public navigation guide describe runtime ownership;
the callable typing issue no longer blocks qualifying them under the shared
native facade. Record compiler and runtime evidence separately.
