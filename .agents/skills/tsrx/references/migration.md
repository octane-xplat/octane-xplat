# Legacy TSRX migration

This guide lists legacy TSRX syntax that changed or was removed in current TSRX.

## Quick map

| Legacy | Current |
| --- | --- |
| `component Name(props) { ... }` | `function Name(props) @{ ... }` |
| `const Name = component (...) => { ... }` | `const Name = (...) => @{ ... }` |
| Statement-position JSX throughout templates | Standard JSX plus explicit `@` templates |
| Multiple top-level JSX statements | One final JSX-producing statement, usually a fragment |
| Local JS directly inside JSX children | `@{ ... }` statement containers or `@` control blocks |
| Direct text child `"Text"` | Standard JSX text `Text` |
| `<tsrx>...</tsrx>` expression island | `@{ ... }` expression template |
| `<tsx>...</tsx>` expression island | Ordinary JSX or `<>...</>` |
| Required `<>...</>` wrapper for expression-position UI | Ordinary JSX; fragments only for siblings |
| `if` / `else if` / `else` | `@if` / `@else if` / `@else` |
| `for (... of ...; index i; key id)` | `@for (... of ...; index i; key id)` |
| Manual empty-list branch around loops | `@for (...) { ... } @empty { ... }` |
| `switch` / `case` / `default` / `break` | `@switch` / `@case:` / `@default:` |
| `try` / `pending` / `catch` | `@try` / `@pending` / `@catch` |
| Guard fallback + bare `return;` | `return <Fallback />` or `return null` in top-level function `@{}` |
| Conditional hook extraction | Hoist hooks or extract explicit child components |
| `{text expr}` | Removed from TSRX |
| `{html expr}` | Removed from TSRX |
| `{style "className"}` | Removed from TSRX |
| `{ref expr}` and named `ref` props | Removed from TSRX |

## Components

Legacy:

```tsrx
export component Button({ label }: { label: string }) {
  <button>"Save: "{label}</button>
}
```

Current:

```tsx
export function Button({ label }: { label: string }) @{
  <button>Save: {label}</button>
}

const Button = ({ label }: { label: string }) => @{
  <button>Save: {label}</button>
}
```

Current component bodies use `@{ ... }`. The output is the final JSX-producing statement unless a top-level `return` exits earlier.

## JSX, text, and local statements

Legacy TSRX treated JSX as statements and allowed local JavaScript directly inside element children:

```tsrx
<div>
  const greeting = `Hello, ${name}`;
  <p>"Greeting: "{greeting}</p>
</div>
```

Current TSRX keeps JSX text and expression rules. Use `@{ ... }` for local statements inside layout:

```tsx
<div>@{
  const greeting = `Hello, ${name}`;
  <p>Greeting: {greeting}</p>
}</div>
```

Top-level component output now comes from one final JSX-producing statement. Wrap sibling outputs in a fragment:

```tsx
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

```tsrx
const title = <tsrx>
  const label = name.toUpperCase();
  <span>"Title: "{label}</span>
</tsrx>;

const body = <tsx><p>Body</p></tsx>;
```

Current TSRX uses ordinary JSX for plain expression values and `@{ ... }` when statements are needed:

```tsx
const body = <p>Body</p>;

const title = @{
  const label = name.toUpperCase();
  <span>Title: {label}</span>
};
```

## Control flow

Legacy template control flow used JavaScript statement spelling. Current TSRX prefixes JSX-producing control flow with `@`.

```tsx
@if (status === 'loading') {
  <Spinner />
} @else {
  <Content />
}
```

```tsx
@for (const item of items; index i; key item.id) {
  <Item item={item} index={i} />
} @empty {
  <Empty />
}
```

`@for` bodies produce one JSX result per iteration. Legacy loop bodies allowed item skips with `continue`; current `@for` bodies exclude both `continue` and `break`.

```tsx
@switch (kind) {
  @case 'warning':
  @case 'error': {
    <Alert />
  }
  @default: {
    <Info />
  }
}
```

Legacy switch fallthrough changed to stacked `@case` labels sharing a block. `break` is omitted.

```tsx
@try {
  <Panel />
} @pending {
  <Skeleton />
} @catch (error, reset) {
  <ErrorView error={error} onRetry={reset} />
}
```

When no fallback or error UI is needed, leave `@pending` or `@catch` empty instead of rendering `<></>`.

## Early returns

Legacy guards rendered fallback UI, then exited with bare `return;`:

```tsrx
component Dashboard({ user }: { user: User | null }) {
  if (!user) {
    <p>"Please sign in."</p>
    return;
  }

  <h1>"Welcome, "{user.name}</h1>
}
```

Current top-level function `@{ ... }` bodies can return fallback values directly:

```tsx
function Dashboard({ user }: { user: User | null }) @{
  if (!user) return <p>Please sign in.</p>;
  <h1>Welcome, {user.name}</h1>
}
```

Other TSRX templates and control-flow blocks produce output from their final JSX-producing statement.

## Hook usage

Legacy TSRX designs allowed hooks in conditional render paths and relied on compiler extraction to keep the target framework's hook rules intact. Current TSRX no longer treats hooks as conditionally extractable.

Do not place hooks inside `@if`, `@for`, `@switch`, conditional branches, loops, or paths after early returns.

When the hook should always exist for the component, hoist the hook call before conditional control flow:

```tsx
function Panel(props) @{
  const data = useData(props.id);

  @if (!props.visible) {
    <Hidden />
  } @else {
    <View data={data} />
  }
}
```

When the hook should only exist for one branch or one repeated item, move that branch or item into an explicit child component and call the hook at the child component's top level:

```tsx
function StatusWrapper(props: { streamId: string | null }) @{
  @if (!props.streamId) {
    <p>Disconnected</p>
  } @else {
    <ActiveStream streamId={props.streamId} />
  }
}

function ActiveStream(props: { streamId: string }) @{
  const data = useSubscription(props.streamId);
  <div>Live: {data}</div>
}
```

## Removed directives and refs

The legacy child directives `{text expr}` and `{html expr}` were removed from TSRX. Migrate text and raw HTML behavior to the selected target/runtime APIs.

The legacy scoped-style composition directive `{style "className"}` was removed from TSRX. Migrate cross-component class passing to ordinary class/className props or another target-specific styling pattern.

The legacy TSRX ref forms were removed from TSRX:

```tsrx
<input {ref input} />
<Field inputRef={ref input} />
```

Use the selected target's normal ref API instead.
