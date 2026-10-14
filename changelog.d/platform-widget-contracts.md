# Platform widget contracts get matching names

Every platform-authentic widget now exports a props type named after the
widget it describes: `UISwitchProps`, `UISliderProps`,
`UIActivityIndicatorViewProps`, `UITableViewProps`/`UITableViewHandle`,
`UITabBarProps`, `UIModalProps`, and `SideDrawerProps` on
`@octane-xplat/ui/ios`; `MaterialSwitchProps`, `SeekBarProps`,
`CircularProgressIndicatorProps`, `RecyclerViewProps`/`RecyclerViewHandle`,
`BottomNavigationViewProps`, `MaterialDialogProps`, and `DrawerLayoutProps`
on `@octane-xplat/ui/android`. `LiquidGlassProps` and
`LiquidGlassContainerProps` now cover the `modifiers` escape hatch like the
rest. The shared `Platform*` value and identity contracts
(`PlatformSwitchProps`, `PlatformListProps`, `PlatformTabsProps`,
`PlatformTabSpec`, `PlatformIconChoice`, `PlatformWidgetProps`,
`NativeModifier`, viewability, and refresh types) keep their names on both
subpaths.

Three unrelated or ambiguous names left the platform barrels. `TabsProps`,
`PlatformListProps as ListProps`, and `PlatformTabSpec as TabSpec` described
the portable `Tabs`/`List`/`TabSpec` contracts (or hid the platform shape
behind their names); the real contracts keep their `Platform*` spellings.
`SliderProps`, `ActivityIndicatorProps`, and `DrawerProps` moved to the root
barrel only — the same interfaces the portable `Slider`, `ActivityIndicator`,
and `Drawer` already used. The glyph selector is now `PlatformIcon`
(`PlatformIcon.select({ ios, android })`); the `/ios` and `/android`
`Icon` export was a helper object, not the shared `Icon` component.

NativeScript integration plumbing (`rootLayoutFor`, `topRootLayout`,
`findInRootLayouts`, `layoutsForRoute`, `bottomSheetHost`) moved from
`@octane-xplat/ui/native` to `@octane-xplat/ui/nativescript` — the explicit
name keeps host lifecycle imports distinct from the platform-widget
subpaths. On `@octane-xplat/ui/web`, the `HoverCard`, `Tooltip`,
`HoverCardProps`, and `TooltipProps` re-exports are deprecated; the portable
components and types live on the root barrel, while `useOutlineFromDOM` and
friends stay as the DOM-specific API.

Migrating: import `ui/nativescript` instead of `ui/native`; use
`PlatformIcon.select` for tab glyphs; type platform-widget props with the
widget-named `*Props`/`*Handle` types; and import `TabsProps`, `ListProps`,
`TabSpec`, `SliderProps`, `ActivityIndicatorProps`, `DrawerProps`,
`HoverCard`, or `Tooltip` from the root `@octane-xplat/ui` entry.
