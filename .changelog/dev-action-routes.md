### Dev actions can navigate to their screen first

Declared development actions can now carry a `route`: when invoked while their
owning screen is not mounted, the app navigates to the URL itself, waits for
the screen's handler to attach, then runs the action. Generated routes also
register a built-in `xplat.navigate` dev action in development builds, and the
actions listing reports each instance's current `location` — agents no longer
need to know your route structure to reach screen-owned actions.

```ts
import { defineDevAction } from '@octane-xplat/platform/dev-actions'

export const saveDraft = defineDevAction({
	id: 'form.save-draft',
	title: 'Save form draft',
	description: 'Persists the checkout form state that only exists in the screen.',
	effects: { summary: 'Writes the form draft', appState: true },
	route: '/checkout',
})
```

[Development actions guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/testing/development-actions.md#reach-screen-owned-actions-by-route)
