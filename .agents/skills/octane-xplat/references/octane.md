# Octane semantics

Octane looks like React, but its compiler changes several rules that React
habits get wrong. Read this before writing hooks, component state, context,
refs, error boundaries, or code that inspects `children`. TSRX syntax itself
(`@{ }`, `@if`, `@for`, `@try`) lives in the `tsrx` skill.

This page is checked against `octane@0.16.3`, the version in the repository
catalog. Match it to the app's installed version. Upstream's full divergence
contract is
[Differences from React](https://github.com/octanejs/octane/blob/octane%400.16.3/docs/differences-from-react.md);
read it when a behavior here does not answer the question.

Shared files compile twice: the DOM renderer for web, and the universal renderer
for iOS, Android, and desktop hosts. Everything below applies to both unless a
section names one target.

## Dynamic HTML tags

The pinned compiler/parser combination rejects computed `<{tag}>` syntax in
Heading. Use a capitalized tag variable for a dynamic HTML element; recheck the
[recorded parser limitation](../../../docs/toolchain.md) when upgrading Octane
or TSRX.

```tsrx
/** @jsxImportSource @octane-xplat/jsx/dom */
export function Title(props: { level: 1 | 2 | 3; label: string }) @{
  const Tag = `h${props.level}` as const
  <Tag>{props.label}</Tag>
}
```

## Hooks belong to call sites, not call order

A hook may sit behind a condition or after an early return. The compiler gives
each call site its own slot, and a hook that a render skips keeps its state
until its owner unmounts. A hook inside a plain JavaScript loop is a compile
error; give each item its own scope with a keyed `@for` or a child component.

```tsrx
import { useState } from 'octane'
import { Pressable, Text, VStack } from '@octane-xplat/ui'

type Bag = { id: string; name: string }

export function BagList(props: { bags: readonly Bag[]; locked: boolean }) @{
  if (props.locked) return <Text>Locked</Text>
  // Keeps its value while locked, because only this render skipped it.
  const [showAll, setShowAll] = useState(false)
  <VStack>
    <Pressable onPress={() => setShowAll(!showAll)}>
      <Text>{showAll ? 'Show fewer' : 'Show all'}</Text>
    </Pressable>
    @for (const bag of props.bags; key bag.id) {
      // One state cell per bag key.
      const [packed, setPacked] = useState(false)
      <Pressable onPress={() => setPacked(!packed)}>
        <Text>{packed ? `${bag.name} (packed)` : bag.name}</Text>
      </Pressable>
    }
  </VStack>
}
```

Effects follow the current render instead: an effect that a completed render
does not reach is cleaned up, and runs again when a later render reaches it.

A component's parameters after `props` are reserved for the renderer and receive
internal values. Pass every input through `props`.

## Dependency arrays are optional

Omit the array for `useEffect`, `useLayoutEffect`, `useInsertionEffect`,
`useMemo`, `useCallback`, and `useImperativeHandle`, and the compiler infers it
from what the callback reads. An explicit array keeps React's exact behavior and
is never rewritten. `null` runs the hook after every render.

```tsrx
import { useEffect } from 'octane'
import { Text } from '@octane-xplat/ui'

function reportView(screen: string) {
  console.log('viewed', screen)
}

export function Screen(props: { name: string }) {
  useEffect(() => reportView(props.name)) // Inferred: reruns when props.name changes.
  useEffect(() => reportView('first mount'), []) // Explicit: runs once.
  useEffect(() => reportView('any render'), null) // Runs after every render.
  return <Text>{props.name}</Text>
}
```

Inference only sees reads. An effect that must rerun for a value it never reads,
such as one that only writes to a ref or host view, needs an explicit array. A
callback produced by a call, such as `useEffect(makeEffect())`, also needs an
explicit array or `null`.

## State that follows a prop: `useLinkedState`

A `useState` initial value is read once, as in React. When local, editable state
should reset whenever a source prop changes, use `useLinkedState` instead of an
effect or a setter call during render. It returns the new value in the same
render that the source changes.

```tsrx
import { useLinkedState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function TripNameField(props: { tripId: string; name: string }) {
  // Editable copy of the name that resets when a different trip is shown.
  const [draft, setDraft] = useLinkedState(props.tripId, () => props.name)
  return <TextInput value={draft} onChange={setDraft} accessibilityLabel="Trip name" />
}
```

`useState`, `useReducer`, and `useLinkedState` also return a third member, a
stable getter for the latest scheduled value. Use it in async callbacks instead
of mirroring state into a ref.

```ts
const [draft, setDraft, getDraft] = useState('')
```

## Template branches remount their contents

Each `@if`/`@else` and `@switch` arm owns its own render scope. Switching arms
remounts what is inside, even when both arms render the same component, so
uncontrolled values and child state reset. Keep one component outside the
branch and make its props conditional to preserve identity.

```tsrx
import { TextInput } from '@octane-xplat/ui'

export function NameField(props: { name: string; editing: boolean }) @{
  // Typed text survives toggling `editing`; an @if with two TextInputs would reset it.
  <TextInput defaultValue={props.name} isReadOnly={!props.editing} accessibilityLabel="Name" />
}
```

## Context is its own provider

`createContext` returns the provider component. `Context.Provider` and
`Context.Consumer` do not exist. Read context with `use` or `useContext`,
which may also sit behind a condition.

```tsrx
import { createContext, use } from 'octane'
import { Text } from '@octane-xplat/ui'
import type { Renderable } from '@octane-xplat/ui'

const Units = createContext<'km' | 'mi'>('km')

export function MilesProvider(props: { children?: Renderable }) {
  return <Units value="mi">{props.children}</Units>
}

export function Distance(props: { value: number }) {
  const units = use(Units)
  return <Text>{`${props.value} ${units}`}</Text>
}
```

## Refs are ordinary props

A component receives `ref` in its props; there is no `forwardRef` or
`createRef`. A ref may be a callback, a `{ current }` object, or an array of
refs. `useLazyRef(() => value)` initializes a ref lazily; plain
`useRef(fn)` stores the function itself, as in React.

```tsrx
import { TextInput } from '@octane-xplat/ui'
import type { TextInputProps } from '@octane-xplat/ui'

export function SearchField(props: { ref?: TextInputProps['ref'] }) {
  return <TextInput ref={props.ref} accessibilityLabel="Search" />
}
```

## Errors and loading: `@try`, `@pending`, `@catch`

Octane has no class components, so error boundaries are TSRX directives. In
shared and native code, use `@try`/`@pending`/`@catch`; the `ErrorBoundary`
and `Suspense` components are not part of the universal runtime (see
[the native runtime subset](#the-native-runtime-subset)). The
[data guide](../../../../docs/app/data.md) shows the full loading pattern.

```tsrx
import { Button, Text } from '@octane-xplat/ui'
import { TripDetails } from './TripDetails'

export function TripPanel(props: { id: string }) @{
  @try {
    <TripDetails id={props.id} />
  } @pending {
    <Text>Loading trip…</Text>
  } @catch (error, reset) {
    <Button label="Retry" clickAction={reset} />
  }
}
```

## Children are opaque

Children written inside a template reach a component as a compiled render body,
not as an element list. Rendering `{props.children}` works. On web,
`Children.count`, `Children.map`, `Children.toArray`, `Children.only`, and
`cloneElement` see nothing unless the component is wrapped in
[`descriptorChildren`](https://github.com/octanejs/octane/blob/octane%400.16.3/docs/differences-from-react.md#template-children-and-inspection).
Native targets support `Children.toArray` and `Children.map`; `descriptorChildren`
is accepted as an identity wrapper. Other child inspection methods and
`cloneElement` remain unavailable on native.

For shared components, take the data as a prop instead of inspecting children:

```tsrx
import { HStack, Text } from '@octane-xplat/ui'

type Step = { id: string; label: string }

export function Steps(props: { steps: readonly Step[] }) @{
  <HStack>
    @for (const step of props.steps; index i; key step.id) {
      <Text>{`${i + 1}. ${step.label}`}</Text>
    }
  </HStack>
}
```

## The native runtime subset

The universal compiler accepts only these runtime imports from `octane`
(`UNIVERSAL_RUNTIME_IMPORTS` in
[`compile-universal.js`](https://github.com/octanejs/octane/blob/octane%400.16.3/packages/octane/src/compiler/compile-universal.js)):

`Activity`, `Children`, `descriptorChildren`, `createContext`, `createPortal`, `lazy`, `memo`,
`requestFormReset`, `startTransition`, `use`, `useActionState`,
`useCallback`, `useContext`, `useDebugValue`, `useDeferredValue`, `useEffect`,
`useEffectEvent`, `useFormState`, `useFormStatus`, `useId`,
`useImperativeHandle`, `useInsertionEffect`, `useLayoutEffect`,
`useLazyRef`, `useLinkedState`, `useMemo`, `useOptimistic`, `useReducer`,
`useRef`, `useState`, `useSyncExternalStore`, `useTransition`.

Any other runtime import, such as `cloneElement`, `createElement`,
`ErrorBoundary`, `Suspense`, or `flushSync`, fails the native build with
`runtime import "<name>" has no universal renderer implementation.` Imports
must be named; a namespace or default import of `octane` is also a compile
error. Type-only imports are unrestricted, and signals come from
`octane/signals`, which this check does not cover. A listed import compiles,
but `Activity` and `createPortal` still depend on renderer support; read
[overlays](overlays.md) before relying on portals.

```ts
import { useEffect, useState } from 'octane' // Named imports: accepted.
// import * as Octane from 'octane'          // Rejected on native targets.
```

## Native JSX belongs inside components

The universal compiler only lowers JSX inside a component it recognizes: a
top-level function declaration, or a top-level `const`/`let` with one declarator
initialized by an arrow, a function expression, or `memo(...)`. Inside such a
component, JSX may go anywhere, including local values, render-prop callbacks,
helper functions, and nested component declarations.

JSX anywhere else in the module fails the native build with
`JSX in an unsupported module declaration requires universal plan lowering and cannot fall back to DOM codegen.`
The web build accepts the same code, so the error first appears on native. The
rejected positions include:

- render arrows inside module-level objects or arrays
- render callbacks passed to module-level calls, such as `register('home', () => <Text />)`
- module-level JSX values, such as `const empty = <Text />`
- factories that declare and return a component
- a component declaration that shares its `const` with other declarators
- JSX inside hooks that return data, such as table plugin objects

Upstream rejects unlowered JSX on purpose rather than falling back to DOM code.
It has not said whether these positions will ever be supported. Declare a named
component and reference it instead:

```tsrx
import { Text } from '@octane-xplat/ui'

function HomeTab() {
  return <Text>Home</Text>
}

// `render: () => <Text>Home</Text>` here would fail the native build.
export const tabs = [{ id: 'home', render: HomeTab }] as const
```

For a data-returning hook, keep its JSX in a named component and return a
`{ component, props }` descriptor that a component instantiates. The table
plugin hooks return `tableSlot(...)` descriptors, and the Table leaves render
them through `TableSlot`. `tests/table-universal.test.mjs` checks the AppKit
compilation of these hooks with HMR on and off.

```tsrx
import { Text } from '@octane-xplat/ui'
import { tableSlot } from './table-slot'

function RowNumber(props: { value: number }) @{
  <Text>{props.value}</Text>
}

export function useNumberedRows(startFrom: number) {
  return { renderCell: (index: number) => tableSlot(RowNumber, { value: index + startFrom }) }
}
```

## Universal roots take compiled components

This matters for host and harness code, not app screens. A universal root, such
as the one from `createMacOSRoot`, only renders components the Octane compiler
defined. A plain function throws
`Universal roots accept only compiler-defined universal components.` Declare
the component in a compiled `.tsrx` or `.tsx` module and pass that export to the
root.

```tsrx
// Story.tsrx: compiled by Octane, so a universal root accepts it.
import { Text } from '@octane-xplat/ui'

export function Story() {
  return <Text>Story</Text>
}
```

## Not available by design

Class components, `forwardRef`, `createRef`, `Context.Consumer`, `Profiler`,
`SuspenseList`, Server Components, and `StrictMode` double-invocation do not
exist in Octane. On web, `StrictMode` is only a pass-through wrapper; on native
it cannot be imported. Use function components, ref props, `use(Context)`, and
`@try` instead.
