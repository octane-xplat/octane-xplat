# Native styled factory and shared JSX types

Status: declaration-level mismatch observed against v0.16.0; native runtime
behavior was not exercised for this finding.

`packages/ui/src/styled.tsrx` returns the result of
`defineUniversalComponent`. Its emitted declaration in
`types/generated/styled.d.ts` requires `(props, context)`, while the shared
JSX facade's `ElementTypeOf` in `packages/jsx/src/shared.d.ts` accepts a
single-prop callable. With `jsxImportSource: "@octane-xplat/jsx"`, rendering
the factory result as a JSX component produces TS2786. The web factory emits
a single-prop callable, so do not generalize this finding to the DOM renderer.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { styled, Pressable } from '@octane-xplat/ui'

const DangerButton = styled(Pressable, { variants: { danger: 'bg-danger' } })
// TS2786: the native factory result needs two arguments; JSX supplies props.
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

A follow-up should align the callable declaration and shared JSX contract,
then qualify factory rendering on the intended renderers. The diagnostic alone
does not establish a native runtime failure or justify changing the facade to
accept arbitrary function signatures.

## Context providers

The same shared facade rejects Octane `Context<T>` as a JSX tag because its
callable declaration requires `(props, scope)`. A provider remains a supported
runtime construct; this finding is limited to the shared native JSX types.
Do not infer that provider-based runtime ownership is unavailable.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { createContext } from 'octane'
import { Text } from '@octane-xplat/ui'

const Account = createContext('Guest')
export function Example() {
	// TS2786 under the shared native facade.
	return (
		<Account value="Avery">
			<Text>Home</Text>
		</Account>
	)
}
```

Provider examples in the public navigation guide describe runtime ownership;
qualifying them with the v0.16.0 shared native facade also needs the callable
typing issue addressed. Record compiler and runtime evidence separately.
