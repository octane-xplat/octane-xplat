# Primitives

Import the shared surface from `@octane-xplat/ui`. Shared components use
platform leaves behind the same import; platform-authentic widgets use the
conditional `@octane-xplat/ui/ios`, `/android`, or `/web` subpaths. Those
subpaths resolve only for their target, so keep imports in a matching
platform-suffixed file. A runtime branch does not prevent an incompatible
static import from loading.

```tsx
import { HStack, Text } from '@octane-xplat/ui'

export function PackingRow() {
	return (
		<HStack>
			<Text>Passport</Text>
			<Text>Packed</Text>
		</HStack>
	)
}
```

Choose the page for the current task; load other pages only when their constraints apply.

| Task | Reference |
| --- | --- |
| Shared primitive contracts | [Read for this task](primitives/contracts.md) |
| Typography and readable text | [Read for this task](primitives/typography.md) |
| Native interaction and accessibility | [Read for this task](primitives/accessibility.md) |
| Containers and scrolling | [Read for this task](primitives/layout.md) |
| Action controls and feedback | [Read for this task](primitives/actions.md) |
| Text entry and editing | [Read for this task](primitives/text-entry.md) |
| Finite choices and menus | [Read for this task](primitives/selection.md) |
| Dates and times | [Read for this task](primitives/dates.md) |
| Search, tokens, and structured filters | [Read for this task](primitives/search.md) |
| Images, video, and paged media | [Read for this task](primitives/media.md) |
| Tables and outlines | [Read for this task](primitives/tables.md) |
| Experimental Windows controls | [Read for this task](primitives/windows.md) |

## Platform-authentic subpaths

The OS widget is the value of these exports. They are intentionally absent
from the shared root barrel.

Choose an OS subpath when platform chrome is the intended behavior. The
[platform widgets guide](../../../../docs/app/primitives.md) and package export
map own the complete inventory; import only names declared by that subpath.
For example, an iOS switch belongs in an `.ios` leaf:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// PackingToggle.ios.tsx
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackingToggle() {
	return <UISwitch value={false} onChange={console.log} />
}
```

## Conventions

- `className` composes with each leaf's own `vx-*` class. Pass arrays directly
  to the JSX prop, for example `className={['vx-view', props.className]}`.
- `id` sets the element id — probes find views by it (`getViewById` on
  native, DOM id on web).
- Pan events normalize to `{x,y,dx,dy,vx,vy,state,target}` and swipe events
  to `{direction}`. Native pan velocity is wired on iOS through
  `velocityInView` and on Android through `VelocityTracker`; both report
  velocity in dips per second.
- `children` is a universal renderable; avoid over-typing it.
- Accessibility props map to ARIA/native attributes; see
  `docs/platform/platform-services.md` for the current mappings.
