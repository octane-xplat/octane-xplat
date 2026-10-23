# @octane-xplat/lib

Internal shared utilities for Octane Xplat. This package is published so framework
packages can share utilities, but its API is unstable and may introduce breaking
changes at any time. External use is discouraged. It participates in the
repository's lockstep release.

`cx` flattens nested arrays, drops falsy values, and joins the remaining values
with spaces. Imperative `view.className` assignments still need this string even
when a renderer normalizes declarative class names.

```ts
import { cx } from '@octane-xplat/lib'

const className = cx('panel', ['selected', false], undefined)
// 'panel selected'
```

Use `pickAccessibilityProps` and `pickLayoutChildProps` to forward their named
prop groups between components. They copy values unchanged, including
`undefined`; role translation and layout-to-style conversion belong at the
host. Keep `style`, `className`, IDs, refs, handlers, and platform escape bags
explicit. The matching `equal*` helpers compare only those groups with `===`,
so accessibility state objects are compared by identity.

```ts
import {
	pickAccessibilityProps,
	pickLayoutChildProps,
	equalAccessibilityProps,
	equalLayoutChildProps,
} from '@octane-xplat/lib'

const props = { accessibilityLabel: 'Pages', row: 0, style: { height: 200 } }
const forwarded = {
	...pickAccessibilityProps(props),
	...pickLayoutChildProps(props),
	style: props.style,
}
const next = { ...props, row: 1 }
const sameGroups =
	equalAccessibilityProps(props, next) && equalLayoutChildProps(props, next)
// sameGroups is false; forwarded.row remains 0.
```
