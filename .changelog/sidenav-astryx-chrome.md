### SideNav now matches the Astryx sidebar

`SideNav`, `SideNavHeading`, `SideNavSection`, `SideNavItem`, and
`SideNavCollapseButton` pick up the Astryx 0.6.4 chrome on web: 32px pill
item rows on the label type scale (14px, 20px line), `--color-neutral`
selected fills at weight 500, secondary icon and section-title colors,
sticky top/bottom zones with Astryx spacing, hover/pressed overlays, focus
rings, and theme-driven radius/element-size vars on all platforms.
`SideNavCollapseButton` resolves its size from the size cascade (footer
`sm`) like upstream.

Labels also follow Astryx: the rail button is "Collapse sidebar"/"Expand
sidebar", item child toggles read "Collapse {label}"/"Expand {label}", and
the heading menu button is "Open menu". A collapsible item without its own
action now toggles children on press with an inline chevron, icon-less
items drop out of the collapsed rail, and the collapsed rail is 48px.

**Breaking change:** default colors, spacing, and typography of every
SideNav surface change in light and dark mode, and the sticky top/bottom
borders are gone. Apps that pinned the old look should carry the values in
their own stylesheet.

[SideNav](https://octane-xplat.dev/app/navigation/)
