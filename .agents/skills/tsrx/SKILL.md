---
name: tsrx
description: Use when writing, editing, or reviewing TSRX (.tsrx)
---

# TSRX Syntax Mechanics

TSRX is TypeScript + JSX with opt-in syntax for JSX-producing templates. Existing TypeScript and JSX keep their meanings, with native `<style>` blocks parsed as CSS. To render syntax markers as text, use JSX string expressions like `{'@if'}`.

```tsrx
const marker = <p>{'@if'} is a template marker.</p>
```

For legacy TSRX migration notes, read `references/migration.md`.

## Template Result Rule

`@{ ... }` creates a local scope whose final statement may produce JSX.

```tsrx
const count = 2
const summary = @{
  const label = `${count} bags`
  <p>{label}</p>
}
```

Any TSRX block that produces no JSX output evaluates to `null`. This applies to `@{ ... }` templates, control-flow branches, loop iterations, `@try`/`@pending`/`@catch` blocks, and TSRX function bodies. This is useful for side-effect-only statements such as logging.

```tsrx
const user = { id: 'ada' }
const logged = @{
  console.log('Rendered user card', user.id)
} // logged is null because this template produces no JSX.
```

As a JSX child, mirror formatter shape:

```tsrx
const count = 2
const summary = <div>@{
  const label = `${count} bags`
  <p>{label}</p>
}</div>
```

Final JSX-producing forms: JSX element, JSX fragment, `@if`, `@for`, `@switch`, `@try`. Wrap final text or expression values in a fragment: `<>{label}</>`.

```tsrx
const label = 'Packed'
const status = @{ <>{label}</> }
```

`return` is available only in top-level TSRX function bodies. Other TSRX blocks yield their final JSX-producing statement.

```tsrx
function Status(props: { hidden: boolean }) @{
  if (props.hidden) return null
  <p>Packed</p>
}
```

Use templates as expressions, directly inside JSX layout, or as function bodies.

```tsrx
const card = <section>@{ <p>Trip summary</p> }</section>
```

## JSX Conveniences

- JS comments may appear directly in JSX: `// ...` and `/* ... */`.
- In JSX attribute position, `{foo}` means `foo={foo}`.
- Dynamic tag names use expression tags: `<{props.as}>...</{props.as}>` or self-closing `<{props.icon} />`. The opening and closing expressions must match syntactically.

```tsrx
// A .web.tsrx component demonstrating JSX shorthand and expression tags.
function Caption(props: { as: string; title: string }) @{
  const title = props.title
  <{props.as} {title}>
    // Direct JSX comments do not become visible text.
    <span>Trip notes</span>
  </{props.as}>
}
```

## `@if`

```tsrx
@if (true) {
  <p>Ready</p>
} @else if (false) {
  <p>Waiting</p>
} @else {
  <p>Unavailable</p>
}
```

Each branch may run local JS statements before producing output. `@else` is optional in both root and nested positions; if no branch matches, the result is `null`.

## `@for` / `@empty`

```tsrx
const items = [{ id: 'bag', label: 'Carry-on' }]
const list = @for (const item of items; index i; key item.id) {
  <p>{i}: {item.label}</p>
} @empty {
  <p>No bags</p>
}
```

The suffix after `;` may declare `index`, `key`, or `index` then `key`. The `index` variable is in scope for `key`. A `key` is propagated to rendered elements, including through shorthand fragments. `@empty` renders for empty iterables.

Each iteration may run local JS statements before producing output. `break` and `continue` are excluded from `@for` bodies.

```tsrx
const bags = ['Carry-on', 'Day bag']
const labels = @for (const bag of bags; index i) {
  const label = `${i + 1}. ${bag}`
  <p>{label}</p>
}
```

## `@switch`

```tsrx
const value = 'a'
const selected = @switch (value) {
  @case 'a': {
    <p>A</p>
  }
  @case 'b': {
    <p>B</p>
  }
  @case 'c': {
    <p>C</p>
  }
  @default: {
    <p>Unavailable</p>
  }
}
```

`@case` and `@default` use trailing `:`. On this branch’s pinned parser, give each case its own block; stacked case labels are rejected. The selected branch supplies the output; `break` is omitted. `@default` is optional in both root and nested positions; if no branch matches, the result is `null`.

## `@try` / `@pending` / `@catch`

```tsrx
@try {
  <p>Trip content</p>
} @pending {
  <p>Loading</p>
} @catch (error, reset) {
  <button onClick={reset}>{String(error)}</button>
}
```

`@try` protects the main render tree, `@pending` supplies async fallback UI, and `@catch` supplies error UI. `@catch` receives `error` and optionally `reset`. Emitted boundaries are target-specific.

Use empty `@pending {}` or `@catch (...) {}` blocks when there is no fallback or error UI; do not add an empty fragment solely to satisfy the block.

```tsrx
const protectedContent = @try {
  <p>Trip content</p>
} @pending {
} @catch (error) {
}
```

## Function Bodies

```tsrx
function Component(props: { hidden: boolean; label: string }) @{
  if (props.hidden) return null
  <p>{props.label}</p>
}

const Greeting = (props: { label: string }) => @{
  <p>{props.label}</p>
}
```

Function declarations and arrow functions may use `@{ ... }` bodies. Top-level early `return` exits the function and may return JSX, `null`, or TSRX `@` blocks; otherwise the final JSX-producing statement supplies the output.

## Native `<style>`

JSX-child style blocks contain direct CSS, are extracted, scoped, and render as `null`.

```tsrx
<div>
  <h1>Title</h1>
  <style>
    h1 { color: coral; }
    .box { padding: 1rem; }
  </style>
</div>
```

Variable-initializer style blocks create class maps; class selectors become typed properties. This form works locally or at module scope.

```tsrx
const styles = <style>
  .card { border: 1px solid #ccc; }
</style>;

<div className={styles.card} />
```

Use `:global(...)` for intentional global selectors. For runtime values, put CSS custom properties on JSX elements and read them inside CSS.

```tsrx
// Browser-only styling example, in a .web.tsrx file.
const tint = '#2563eb'
const card = <section style={{ '--trip-tint': tint }}>
  <p>Kyoto</p>
  <style>
    p { color: var(--trip-tint); }
    :global(body) { margin: 0; }
  </style>
</section>
```

## Lazy Destructuring `&`

The upstream lazy-destructuring syntax below targets Solid, Vue, and Ripple.
It is reference syntax, not runnable on this branch: the pinned parser rejects `&`
destructuring. Octane Xplat examples use ordinary props instead.

```text
function UserCard(&{ user, theme }) @{
  const &[count, setCount] = user.counter;
  const &{ displayName, ...details } = user;
  <article className={theme} title={details.title}>{displayName}: {count}</article>
}
```

The upstream form is intended for parameters and local/nested destructuring,
including rest patterns that preserve descriptors. This branch does not provide
that capability; use an ordinary props object in Xplat components.
