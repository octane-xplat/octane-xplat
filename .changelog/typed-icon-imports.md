### Type-safe, tree-shaken icons via `icons:*` imports

`@octane-xplat/icons` adds a `xplatIcons` Vite plugin that resolves
`icons:<prefix>/<name>` specifiers to per-icon modules — each import is a
compile-checked, tree-shaking edge instead of a whole `@iconify-json/*`
collection in the bundle. `<Icon>` accepts that data through `icon=`,
skipping the registry lookup entirely; `name=` remains for dynamic lookups,
and `addIcon`/`addIcons` register single icons into it.

```tsx
import xMark from 'icons:heroicons/x-mark'

<Icon icon={xMark} size={16} label="Close" />
```

See [the icons package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/icons#typed-per-icon-imports).
