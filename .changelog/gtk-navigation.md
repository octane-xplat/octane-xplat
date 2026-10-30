### Navigation and app chrome on GTK

GTK apps can now build real app chrome from `@octane-xplat/ui`: `Screen`,
`Tabs`, `TabList`/`Tab`/`TabMenu`, `RouteOutlet`, `NavigationMenu`,
`NavLink`, `NavIcon`, the `AppShell`/`TopNav`/`SideNav`/`MobileNav`
family, `NavHeadingMenu`, `useResizable`/`ResizeHandle`, `SafeArea`,
`KeyboardAvoiding`, `openWindow`, and the container-reveal/image-mode
hooks.

```tsx
import { Screen, Tabs, Text } from "@octane-xplat/ui"

export function Workbench() {
	return (
		<Screen>
			<Tabs
				tabs={[
					{ key: 'files', title: 'Files', render: () => <Text>File list</Text> },
					{ key: 'search', title: 'Search', render: () => <Text>Search results</Text> },
				]}
			/>
		</Screen>
	)
}
```

The shared navigation contract carries over unchanged: `to={validatedDestination}`
drives the default client router through the pane-based `RouteOutlet` —
entries are retained mounted and hidden (back-stack retention), and
app-relative `href` links resolve through `navigateUrl`. `SideNav` is
collapsible and resizable, `AppShell` flips between desktop and mobile
render modes on the window-size breakpoint, and `openWindow` creates a
real second `Gtk.Window` per call (`regular`/`dialog`/`popup` kinds,
handle `closed`/`isClosed`/`setTitle`/`setSize`/`close`). Safe-area and
keyboard insets honestly report zero — desktop GTK has no display
cutouts or software keyboard, and the components still normalize
layout. [GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
