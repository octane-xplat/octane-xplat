---
release: "@octane-xplat/*"
---

### Leaf packages ship generated declarations

**Breaking change:** leaf packages now emit their type declarations with
`tsrx-typegen` instead of shipping hand-written `types/` facades. Component
exports that were declared as `UniversalComponent<Props>` constants are now
generated function declarations — `function Badge(props: BadgeProps): unknown`
on native and `JSX.Element` on web — matching what TypeScript sees when it
type-checks the source directly.

```ts
// before (hand-written facade)
export declare const Badge: UniversalComponent<BadgeProps>
// after (generated)
export declare function Badge(props: BadgeProps): unknown
```

Source imports and subpath layouts are unchanged; update any code that typed a
component value as `UniversalComponent<P>` to use `typeof Badge` or the props
type directly.

A few platforms are typed more honestly than the facades they replace: web
components now return `JSX.Element` (or `null` where the source returns it),
unsupported-platform stubs declare their real `() => never` signatures, and
`IntersectionObserver` exports its class type rather than a constructor
interface.
