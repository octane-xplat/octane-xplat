---
release: tsrx-typegen
---

### Declaration generation no longer type-checks

**Breaking change:** `tsrx-typegen` now emits each file's declarations directly
with `isolatedDeclarations` instead of running a full `tsc` program. Generation
for a large component library now fits in a 128 MB heap. Sources must satisfy
isolatedDeclarations — every exported function, method, variable, and object
with shorthand properties needs an explicit type annotation — and TypeScript
5.5 or newer is required. `tsrx-typegen` reports each missing annotation as
`file(line,col): error TS9xxx`; add the annotation or map the generated file
through `overrides` for signatures you keep handwritten. Type errors are no
longer reported here — run your `typecheck` task separately.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import type { JSX } from '@octane-xplat/jsx/jsx-runtime'
export function Button(props: ButtonProps): JSX.Element @{
	// ...
}
```

[tsrx-typegen documentation](https://github.com/octane-xplat/octane-xplat/blob/main/packages/tsrx-typegen/README.md)
