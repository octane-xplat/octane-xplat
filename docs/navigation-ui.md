# Build a navigation shell and resizable workspace

> Add a top bar, sidebar, mobile menu, or resizable panel around your screens.

A **navigation shell** is the layout around a screen: the top bar, side menu,
and space for page content. `AppShell` combines those pieces. A **slot** is
an option that accepts content, such as the `topNav` option for your top bar.

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
			startContent={<TopNavItem label="Projects" href="/projects" isSelected />}
			endContent={<TopNavItem label="Help" href="/help" />}
		/>
	}
	sideNav={
		<SideNav
			header={<SideNavHeading heading="Workspace" />}
			collapsible={{ defaultIsCollapsed: false, hasButton: true }}
		>
			<SideNavSection title="Projects">
				<SideNavItem label="Overview" icon="home" href="/projects" isSelected />
				<SideNavItem label="Activity" icon="clock" href="/activity" />
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
to control the breakpoint, toggle, open state, and custom drawer content. A custom `MobileNav` element replaces
the automatic drawer. `MobileNavToggle` can be placed manually when
`hasToggle` is false.

A `SideNav` can collapse to an icon rail and can own a resize handle through
its `collapsible` and `resizable` props. `SideNavHeading` supports heading,
superheading, and subheading links plus a `NavHeadingMenu`. `NavHeadingMenu`
and `NavHeadingMenuItem` provide a keyboard-operable menu column; keep the
menu inside the heading that owns its close behavior.

## Choose navigation tabs or page tabs

`TabList` defaults to a navigation landmark. Give each `Tab` a stable value;
`href` renders a real anchor on web and activates the route/link service on
native. Use `role="tablist"` when the strip switches a controlled panel:

```tsx
const [selected, setSelected] = useState('summary');

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
  <Text>Selected panel content</Text>
</View>
```

The caller owns the panels and their `id`/`aria-labelledby` relationship.
`TabMenu` selects from additional values using the same `TabList` state. In
`role="tablist"` mode, links are ignored and the caller changes panels from
`onChange`.

`NavigationMenu` remains the compact item-array strip (`items`, `horizontal`);
use `TopNav` or `SideNav` for composed application navigation. Item `href`s
are links on web and use the route/link service on native.

## Add toolbar actions and responsive overflow

`Toolbar` has `startContent`, `centerContent`, and `endContent` slots. Supply a
required `label`; on web the component exposes the toolbar landmark and moves
focus among its controls with the arrow keys. `orientation` sets both the
layout axis and keyboard direction. `variant` and `dividers` only affect the
painted chrome.

`OverflowList` accepts one child per item. It measures available space and
keeps the fitting items visible; provide `overflowRenderer` to render the
collapsed items and `onOverflowChange` to observe changes. `minVisibleItems`,
`maxVisibleItems`, `maxRows`, `collapseFrom`, and `behavior` tune its policy.
The callback is quiet while every item fits, then fires when membership or
order changes and again with an empty list when overflow clears.

```tsx
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
```

## Resize a region

`useResizable` creates one region or a keyed set of regions. Pass the returned
`region.props` to the matching `ResizeHandle`; `direction` must match on both.
Sizes are px/dip numbers or exact `Npx`/`N%` strings. `pixel()` and
`percent()` create explicit pixel sizes and percentages with a pixel floor or
ceiling.

```tsx
const containerRef = useRef(null)
const sidebar = useResizable({
	containerRef,
	direction: 'horizontal',
	defaultSize: 280,
	minSize: 180,
	maxSize: 480,
	autoSaveId: 'workspace-sidebar',
})

;<View ref={containerRef} className="workspace">
	<SideNav style={{ width: sidebar.size }} />
	<ResizeHandle direction="horizontal" resizable={sidebar.props} />
	<main>Workspace content</main>
</View>
```

Set `collapsible` and `collapsedSize` on a region to let dragging collapse
it. `snaps` define preferred sizes. A multi-region config adds a `regions`
record with stable keys; each region exposes `size`, `isCollapsed`,
`collapse()`, `expand()`, `resize()`, and `props`.

On web, `autoSaveId` uses local storage; iOS and Android use
`ApplicationSettings`. AppKit macOS keeps saved values in memory for the
process. Linux and Windows use the web leaf. Native `OverflowList` uses view
layout measurements; it does not depend on browser `ResizeObserver`.

## Portable boundaries

The shared props do not accept DOM element types, browser refs, or React event
objects. Custom link components (`as`) and link-only attributes (`target`,
`rel`, `download`, `referrerPolicy`) apply to web links; native navigation
uses `href` and the framework route/link service. `style` remains a portable
style object, and `ios`, `android`, and `web` are the explicit escape hatches
for target-only settings. Tabs use the portable `isDisabled` prop rather than
an HTML `aria-disabled` attribute; the leaves map it to native disabled state
and web accessibility/focus behavior.

The AppKit macOS leaf exports this component family with the same public
props. Linux and Windows resolve the web implementations. Web-only hover,
focus, resize observation, and DOM link semantics are documented where they
are used; native controls use press/layout callbacks and native accessibility
properties.
