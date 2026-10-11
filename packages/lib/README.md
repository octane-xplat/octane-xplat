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
