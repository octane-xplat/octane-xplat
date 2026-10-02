# Legacy TSRX migration

This guide lists legacy TSRX syntax that changed or was removed in current TSRX.

## Quick map

| Legacy                                                 | Current                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `component Name(props) { ... }`                        | `function Name(props) @{ ... }`                                    |
| `const Name = component (...) => { ... }`              | `const Name = (...) => @{ ... }`                                   |
| Statement-position JSX throughout templates            | Standard JSX plus explicit `@` templates                           |
| Multiple top-level JSX statements                      | One final JSX-producing statement, usually a fragment              |
| Local JS directly inside JSX children                  | `@{ ... }` statement containers or `@` control blocks              |
| Direct text child `"Text"`                             | Standard JSX text `Text`                                           |
| `<tsrx>...</tsrx>` expression island                   | `@{ ... }` expression template                                     |
| `<tsx>...</tsx>` expression island                     | Ordinary JSX or `<>...</>`                                         |
| Required `<>...</>` wrapper for expression-position UI | Ordinary JSX; fragments only for siblings                          |
| `if` / `else if` / `else`                              | `@if` / `@else if` / `@else`                                       |
| `for (... of ...; index i; key id)`                    | `@for (... of ...; index i; key id)`                               |
| Manual empty-list branch around loops                  | `@for (...) { ... } @empty { ... }`                                |
| `switch` / `case` / `default` / `break`                | `@switch` / `@case:` / `@default:`                                 |
| `try` / `pending` / `catch`                            | `@try` / `@pending` / `@catch`                                     |
| Guard fallback + bare `return;`                        | `return <Fallback />` or `return null` in top-level function `@{}` |
| Conditional hook extraction                            | Hoist hooks or extract explicit child components                   |
| `{text expr}`                                          | Removed from TSRX                                                  |
| `{html expr}`                                          | Removed from TSRX                                                  |
| `{style "className"}`                                  | Removed from TSRX                                                  |
| `{ref expr}` and named `ref` props                     | Removed from TSRX                                                  |

## Components

Legacy (historical syntax; do not copy into current code):

```text
export component Button({ label }: { label: string }) {
  <button>"Save: "{label}</button>
}
```

Current:

```tsrx
export function Button({ label }: { label: string }) @{
  <button>Save: {label}</button>
}

const ButtonArrow = ({ label }: { label: string }) => @{
  <button>Save: {label}</button>
}
```

Current component bodies use `@{ ... }`. The output is the final JSX-producing statement unless a top-level `return` exits earlier.

## JSX, text, and local statements

Legacy TSRX treated JSX as statements and allowed local JavaScript directly inside element children:

```text
<div>
  const greeting = `Hello, ${name}`;
  <p>"Greeting: "{greeting}</p>
</div>
```

Current TSRX keeps JSX text and expression rules. Use `@{ ... }` for local statements inside layout:

```tsrx
const name = 'Ada'
const greetingView = <div>@{
  const greeting = `Hello, ${name}`;
  <p>Greeting: {greeting}</p>
}</div>
```

Top-level component output now comes from one final JSX-producing statement. Wrap sibling outputs in a fragment:

```tsrx
function Card() @{
  <>
    <section>Content</section>
    <style>
      section { padding: 1rem; }
    </style>
  </>
}
```

## Expression-position UI

Legacy expression islands:

```text
const title = <tsrx>
  const label = name.toUpperCase();
  <span>"Title: "{label}</span>
</tsrx>;

const body = <tsx><p>Body</p></tsx>;
```

Current TSRX uses ordinary JSX for plain expression values and `@{ ... }` when statements are needed:

```tsrx
const name = 'Ada'
const body = <p>Body</p>;

const title = @{
  const label = name.toUpperCase();
  <span>Title: {label}</span>
};
```

## Control flow

Legacy template control flow used JavaScript statement spelling. Current TSRX prefixes JSX-producing control flow with `@`.

```tsrx
const status = 'loading'
const content = @if (status === 'loading') {
  <p>Loading</p>
} @else {
  <p>Ready</p>
}
```

```tsrx
const items = [{ id: 'bag', label: 'Carry-on' }]
const rows = @for (const item of items; index i; key item.id) {
  <p>{i}: {item.label}</p>
} @empty {
  <p>No bags</p>
}
```

`@for` bodies produce one JSX result per iteration. Legacy loop bodies allowed item skips with `continue`; current `@for` bodies exclude both `continue` and `break`.

```tsrx
const kind = 'warning'
const status = @switch (kind) {
  @case 'warning': {
    <p>Warning</p>
  }
  @case 'error': {
    <p>Error</p>
  }
  @default: {
    <p>Information</p>
  }
}
```

Use a separate block for each case on this branch’s pinned parser. Legacy
fallthrough and stacked labels are not accepted; `break` is omitted.

```tsrx
@try {
  <p>Trip details</p>
} @pending {
  <p>Loading</p>
} @catch (error, reset) {
  <button onClick={reset}>{String(error)}</button>
}
```

When no fallback or error UI is needed, leave `@pending` or `@catch` empty instead of rendering `<></>`.

```tsrx
const content = @try { <p>Trip details</p> } @pending {} @catch (error) {}
```

## Early returns

Legacy guards rendered fallback UI, then exited with bare `return;`:

```text
component Dashboard({ user }: { user: User | null }) {
  if (!user) {
    <p>"Please sign in."</p>
    return;
  }

  <h1>"Welcome, "{user.name}</h1>
}
```

Current top-level function `@{ ... }` bodies can return fallback values directly:

```tsrx
type User = { name: string }
function Dashboard({ user }: { user: User | null }) @{
  if (!user) return <p>Please sign in.</p>;
  <h1>Welcome, {user.name}</h1>
}
```

Other TSRX templates and control-flow blocks produce output from their final JSX-producing statement.

```tsrx
const title = @{ <h1>Trip details</h1> }
```

## Hook usage

Legacy TSRX designs allowed hooks in conditional render paths and relied on compiler extraction to keep the target framework's hook rules intact. Current TSRX no longer treats hooks as conditionally extractable.

Do not place hooks inside `@if`, `@for`, `@switch`, conditional branches, loops, or paths after early returns.

When the hook should always exist for the component, hoist the hook call before conditional control flow:

```tsrx
import { useState } from 'octane'

function Panel(props: { visible: boolean }) @{
  const [data] = useState('Trip details')

  @if (!props.visible) {
    <p>Hidden</p>
  } @else {
    <p>{data}</p>
  }
}
```

When the hook should only exist for one branch or one repeated item, move that branch or item into an explicit child component and call the hook at the child component's top level:

```tsrx
import { useState } from 'octane'

function StatusWrapper(props: { streamId: string | null }) @{
  @if (!props.streamId) {
    <p>Disconnected</p>
  } @else {
    <ActiveStream streamId={props.streamId} />
  }
}

function ActiveStream(props: { streamId: string }) @{
  const [data] = useState(props.streamId)
  <div>Live: {data}</div>
}
```

## Removed directives and refs

The legacy child directives `{text expr}` and `{html expr}` were removed from TSRX. Migrate text and raw HTML behavior to the selected target/runtime APIs.

The legacy scoped-style composition directive `{style "className"}` was removed from TSRX. Migrate cross-component class passing to ordinary class/className props or another target-specific styling pattern.

The legacy TSRX ref forms were removed from TSRX:

```text
<input {ref input} />
<Field inputRef={ref input} />
```

Use the selected target's normal ref API instead.

```tsrx
// Field.web.tsrx — ordinary browser ref syntax, not the removed TSRX directive.
import { useRef } from 'octane'

export function Field() @{
  const input = useRef<HTMLInputElement | null>(null)
  <input ref={input} aria-label="Bag name" />
}
```
