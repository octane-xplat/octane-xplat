### Collapsible string triggers and `axis="both"` scroll views work on macOS

`Collapsible` no longer crashes on AppKit when its `trigger` is a plain
string — text triggers are wrapped in a text element instead of landing as
a raw text node inside a view container. `ScrollableArea` with
`axis="both"` no longer throws an orientation validation error; both scroll
axes are enabled as documented.

```tsx
<Collapsible trigger="Profile">…</Collapsible>
<ScrollableArea axis="both">…</ScrollableArea>
```
