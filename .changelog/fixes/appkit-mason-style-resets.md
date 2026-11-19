### macOS Mason style removal, flex shorthand, and window sizing

On native macOS, removing a style property (such as `flexDirection` or `display`) now restores the engine default instead of leaving the previous value installed, the `flex` shorthand's basis is honored (so `flex-1` really means `1 1 0%`), and an inline `gap` correctly outranks class-level `row-gap`/`column-gap`. Mason views also stop growing the host window toward their scrollable content's natural height.

See [layout](https://octane-xplat.goddardai.org/components).
