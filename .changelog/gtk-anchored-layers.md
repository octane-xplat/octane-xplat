### Breadcrumbs, hover cards and anchored layers on GTK

GTK apps can now import `Breadcrumbs`, `BreadcrumbItem`, `HoverCard`,
`useHoverCard`, `usePopover` and `useLayer` from `@octane-xplat/ui`.
Layers open in native GTK popups. Context-mode layers follow their anchor,
fixed-mode layers open at the coordinates you pass, and hover cards open
after the pointer rests on the trigger.

```tsx
import { BreadcrumbItem, Breadcrumbs, Button, HoverCard, Text, usePopover } from '@octane-xplat/ui'

export function DocsHeader() {
	const filters = usePopover({ dialogLabel: 'Filters' })
	return (
		<>
			<Breadcrumbs>
				<BreadcrumbItem href="/">Home</BreadcrumbItem>
				<BreadcrumbItem isCurrent>Guides</BreadcrumbItem>
			</Breadcrumbs>
			<HoverCard content={<Text>Last edited today</Text>}>
				<Text>Guides</Text>
			</HoverCard>
			<Button ref={filters.triggerRef} {...filters.triggerProps} label="Filters" clickAction={filters.toggle} />
			{filters.render(<Text>Filter options</Text>)}
		</>
	)
}
```

`NavigationMenu` arrives with GTK routing. [GTK setup and
limits](https://octane-xplat.goddardai.org/linux-gtk).
