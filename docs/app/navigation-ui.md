# Build a navigation shell and resizable workspace

> Add a top bar, sidebar, mobile menu, or resizable panel around your screens.

A **navigation shell** is the layout around a screen: the top bar, side menu,
and space for page content. `AppShell` combines those pieces. A **slot** is
an option that accepts content, such as the `topNav` option for your top bar.

```tsx
import { AppShell, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<AppShell topNav={<Text>Workspace</Text>}>
			<Text>Page content</Text>
		</AppShell>
	)
}
```

Start with [moving between screens](navigation.md) to connect destinations.
This guide adds the surrounding layout with components from `@octane-xplat/ui`.
The examples below show parts to place inside your screen component; they
assume the linked destinations and your page content already exist.

## Compose the application frame

Use `AppShell` for the page frame. `TopNav`, `SideNav`, and `MobileNav` can
also be used independently when an existing layout owns the frame.

```tsx
import {
	AppShell,
	TopNav,
	TopNavHeading,
	TopNavItem,
	SideNav,
	SideNavHeading,
	SideNavSection,
	SideNavItem,
	NavIcon,
	Toolbar,
	Text,
	View,
} from '@octane-xplat/ui'

;<AppShell
	variant="section"
	height="fill"
	banner={<Text>System status</Text>}
	topNav={
		<TopNav
			heading={<TopNavHeading heading="Workspace" logo={<NavIcon icon="grid" />} />}
			startContent={<TopNavItem label="Projects" to="/projects" />}
			endContent={<TopNavItem label="Help" href="https://example.com/help" />}
		/>
	}
	sideNav={
		<SideNav
			header={<SideNavHeading heading="Workspace" />}
			collapsible={{ defaultIsCollapsed: false, hasButton: true }}
		>
			<SideNavSection title="Projects">
				<SideNavItem label="Overview" icon="home" to="/projects" />
				<SideNavItem label="Activity" icon="clock" to="/activity" />
			</SideNavSection>
		</SideNav>
	}
>
	<Toolbar label="Page actions" startContent={<Text>Overview</Text>} />
	<Text>Page content</Text>
</AppShell>
```

`AppShell` measures its own width. At the `mobileNav.breakpoint` (default
`md`, 768 dip/px), it changes the side navigation to a drawer. Set
`mobileNav={false}` to disable that behavior; pass a `MobileNavConfig` object
to control the breakpoint, toggle, open state, and custom drawer content. To
replace the drawer content with your own — typically a `MobileNav` element —
set `mobileNav={{ content: <MobileNav>…</MobileNav> }}`. `MobileNavToggle`
can be placed manually when `hasToggle` is false.

```tsx
import { AppShell, SideNav, SideNavItem, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<AppShell
			mobileNav={{ breakpoint: 'md', hasToggle: true }}
			sideNav={
				<SideNav>
					<SideNavItem label="Projects" to="/projects" />
				</SideNav>
			}
		>
			<Text>Projects</Text>
		</AppShell>
	)
}
```

A `SideNav` can collapse to an icon rail and can own a resize handle through
its `collapsible` and `resizable` props. `SideNavHeading` supports heading,
superheading, and subheading links plus a `NavHeadingMenu`. `NavHeadingMenu`
and `NavHeadingMenuItem` provide a keyboard-operable menu column; keep the
menu inside the heading that owns its close behavior.

```tsx
import { SideNav, SideNavHeading, NavHeadingMenu, NavHeadingMenuItem } from '@octane-xplat/ui'

export function Example() {
	return (
		<SideNav
			collapsible={{ defaultIsCollapsed: false, hasButton: true }}
			header={
				<SideNavHeading
					heading="Workspace"
					menu={
						<NavHeadingMenu>
							<NavHeadingMenuItem label="Personal" onClick={() => console.log('Personal')} />
						</NavHeadingMenu>
					}
				/>
			}
		/>
	)
}
```

## Choose navigation tabs or page tabs

`TabList` defaults to a navigation landmark. Give each `Tab` a stable value;
`to` checks its route inputs and opens the destination in the rendering flow.
For local panels, use `role="tablist"` instead:

```tsx
import { useState } from 'octane'
import { TabList, Tab, TabMenu, View, Text } from '@octane-xplat/ui'

export function Panels() {
	const [selected, setSelected] = useState('summary')

	return (
		<>
			<TabList role="tablist" value={selected} onChange={setSelected}>
				<Tab id="summary-tab" value="summary" label="Summary" panelId="summary-panel" />
				<Tab value="history" label="History" panelId="history-panel" />
				<TabMenu label="More" options={[{ value: 'settings', label: 'Settings' }]} />
			</TabList>
			<View
				id="summary-panel"
				accessibilityLabel="Summary panel"
				web={{ role: 'tabpanel', 'aria-labelledby': 'summary-tab' }}
			>
				<Text>
					{selected === 'summary' ? 'Summary' : selected === 'history' ? 'History' : 'Settings'}
				</Text>
			</View>
		</>
	)
}
```

The caller owns the panels and their `id`/`aria-labelledby` relationship.
`TabMenu` selects from additional values using the same `TabList` state. In
`role="tablist"` mode, omit `to`: typed navigation throws because this mode
controls local panels. Raw `href` is ignored. The caller changes panels from
`onChange`.

```tsx
import { TabList, Tab } from '@octane-xplat/ui'

const links = <TabList value="projects" onChange={() => {}}>
	<Tab value="projects" label="Projects" to="/projects" />
	<Tab value="activity" label="Activity" to="/activity" />
</TabList>
```

`NavigationMenu` remains the compact item-array strip (`items`, `horizontal`);
use `TopNav` or `SideNav` for composed application navigation. Item `to`
fields check route parameters and search inputs; `href` opens a raw URL.
See [typed navigation components](navigation.md#put-typed-routes-in-navigation-components)
for breadcrumbs, nested menu links, custom instances, and disabled items.

```tsx
import { NavigationMenu } from '@octane-xplat/ui'

export function Example() {
	return (
		<NavigationMenu
			horizontal
			items={[{ key: 'projects', label: 'Projects', to: '/projects' }]}
		/>
	)
}
```

## Add toolbar actions and responsive overflow

`Toolbar` has `startContent`, `centerContent`, and `endContent` slots. Supply a
required `label`; on web the component exposes the toolbar landmark and moves
focus among its controls with the arrow keys. `orientation` sets both the
layout axis and keyboard direction. `variant` and `dividers` only affect the
painted chrome. `size` sets the row height and the default `size` for controls
inside the toolbar — a control with its own `size` prop keeps it.

```tsx
import { Toolbar, Button, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<Toolbar
			label="Page actions"
			orientation="horizontal"
			startContent={<Button label="Save" clickAction={() => console.log('Save')} />}
			centerContent={<Text>Draft</Text>}
			endContent={<Button label="Share" clickAction={() => console.log('Share')} />}
		/>
	)
}
```

`OverflowList` accepts one child per item. It measures available space and
keeps the fitting items visible; provide `overflowRenderer` to render the
collapsed items and `onOverflowChange` to observe changes. `minVisibleItems`,
`maxVisibleItems`, `maxRows`, `collapseFrom`, and `behavior` tune its policy.
The callback is quiet while every item fits, then fires when membership or
order changes and again with an empty list when overflow clears.

```tsx
import { OverflowList, Button, Text } from '@octane-xplat/ui'

export function Actions() {
	return (
		<OverflowList
			gap={2}
			minVisibleItems={1}
			collapseFrom="end"
			overflowRenderer={(items) => <Text>More ({items.length})</Text>}
		>
			<Button>
				<Text>Save</Text>
			</Button>
			<Button>
				<Text>Share</Text>
			</Button>
			<Button>
				<Text>Archive</Text>
			</Button>
		</OverflowList>
	)
}
```

## Resize a region

`useResizable` creates one region or a keyed set of regions. Pass the returned
`region.props` to the matching `ResizeHandle`; `direction` must match on both.
Numbers and `pixel()` bounds are dips (CSS pixels on web); exact `Npx` strings
name pixels and `N%` strings name percentages. `percent()` takes a value from
0 to 100 and needs one pixel floor or ceiling. A spacing step used by `Stack`
is 4 dips, so it is a scale value rather than a pixel measurement.

```tsx
import { useRef } from 'octane'
import { View, Text, SideNav, useResizable, ResizeHandle } from '@octane-xplat/ui'

export function Workspace() {
	const containerRef = useRef(null)
	const sidebar = useResizable({
		containerRef,
		direction: 'horizontal',
		defaultSize: 280,
		minSize: 180,
		maxSize: 480,
		autoSaveId: 'workspace-sidebar',
	})

	return (
		<View
			ref={(view) => {
				containerRef.current = view
			}}
			className="workspace"
		>
			<SideNav style={{ width: sidebar.size }} />
			<ResizeHandle direction="horizontal" resizable={sidebar.props} />
			<Text>Workspace content</Text>
		</View>
	)
}
```

Set `collapsible` and `collapsedSize` on a region to let dragging collapse
it. `snaps` define preferred sizes. A multi-region config adds a `regions`
record with stable keys; each region exposes `size`, `isCollapsed`,
`collapse()`, `expand()`, `resize()`, and `props`.

```tsx
import { View, Text, Pressable, useResizable, ResizeHandle, pixel, percent } from '@octane-xplat/ui'

export function Example() {
	const panels = useResizable({
		direction: 'horizontal',
		regions: {
			sidebar: {
				defaultSize: pixel(280),
				minSize: pixel(180),
				maxSize: percent(50, { max: pixel(480) }),
				collapsible: true,
				collapsedSize: 0,
				snaps: [240, 320],
			},
		},
	})

	return (
		<View>
			<View style={{ width: panels.sidebar.size }}>
				<Text>Sidebar</Text>
			</View>
			<ResizeHandle direction="horizontal" resizable={panels.sidebar.props} />
			<Pressable
				onPress={() =>
					panels.sidebar.isCollapsed ? panels.sidebar.expand() : panels.sidebar.collapse()
				}
			>
				<Text>Toggle sidebar</Text>
			</Pressable>
		</View>
	)
}
```

On web, `autoSaveId` uses local storage; iOS and Android use
`ApplicationSettings`. AppKit macOS keeps saved values in memory for the
process. Linux and Windows use the web leaf. Native `OverflowList` uses view
layout measurements; it does not depend on browser `ResizeObserver`.

```tsx
import { View, Text, ResizeHandle, useResizable } from '@octane-xplat/ui'

export function Example() {
	const sidebar = useResizable({ direction: 'horizontal', defaultSize: 280, autoSaveId: 'sidebar' })

	return (
		<View>
			<View style={{ width: sidebar.size }}>
				<Text>Sidebar</Text>
			</View>
			<ResizeHandle direction="horizontal" resizable={sidebar.props} />
		</View>
	)
}
```

## Portable boundaries

The shared props do not accept DOM element types, browser refs, or React event
objects. Custom link components (`as`) and link-only attributes (`target`,
`rel`, `download`) apply to web links. Typed `to` destinations navigate in
the owning flow on every target; native raw `href` values use the URL service. `style` remains a portable
style object, and `ios`, `android`, and `web` are the explicit escape hatches
for target-only settings. Tabs use the portable `isDisabled` prop rather than
an HTML `aria-disabled` attribute; the leaves map it to native disabled state
and web accessibility/focus behavior.

```tsx
import { TabList, Tab } from '@octane-xplat/ui'

export function Example() {
	return (
		<TabList value="projects" onChange={(value) => console.log(value)}>
			<Tab value="help" label="Help" href="https://example.com/help" />
			<Tab value="admin" label="Admin" isDisabled />
		</TabList>
	)
}
```

The AppKit macOS leaf exports this component family with the same public
props. Linux and Windows resolve the web implementations. Web-only hover,
focus, resize observation, and DOM link semantics are documented where they
are used; native controls use press/layout callbacks and native accessibility
properties.
