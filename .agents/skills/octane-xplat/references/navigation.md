# Navigation

Use the canonical routing client on every target. Generated startup configures
its catalog, context source, and declared stacks. Mount the root outlet below
the providers screens should inherit; routed screens then use their own navigator.
Keep that outlet in the long-lived shell: removing it releases owned Pages,
modals, and pending loads. In the starter, edit `src/App.tsrx`; both entry
modules explicitly import it, so adding `App.tsx` does not replace it.

```tsx
import './routes.gen'
import { NavLink, RouteOutlet } from '@octane-xplat/ui'

export function App() {
	return <RouteOutlet><NavLink to="/items/:id" params={{ id: 'coat' }}>Coat</NavLink></RouteOutlet>
}
```

Choose the page for the current task; load other pages only when their constraints apply.

| Task | Reference |
| --- | --- |
| Author and type routes | [Read for this task](navigation/authoring.md) |
| Prepare route inputs and feedback | [Read for this task](navigation/preparation.md) |
| Navigation ownership and retained UI | [Read for this task](navigation/ownership.md) |
| Account changes and baked route data | [Read for this task](navigation/data-auth.md) |
| Web document hosting | [Read for this task](navigation/web-host.md) |
| AppKit navigation and links | [Read for this task](navigation/appkit.md) |
