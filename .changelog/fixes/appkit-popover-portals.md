### AppKit popovers preserve their declaring context

The public macOS Popover, custom pickers and expanded token editors now share
one anchored window-layer implementation. Their content keeps declaring
providers and live updates, rather than rendering inline or in a separate root.
Placement, alignment, offset and controlled dismissal use current props.

```tsx
<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)}
	placement="bottom" alignment="center" offset={12}>
	<Text>Details for the current selection</Text>
</Popover>
```

Use a stable mounted anchor ref and the matching native renderer. Native input,
focus, geometry, accessibility and installed consumers remain unqualified. See
[native custom popovers](https://octane-xplat.goddardai.org/app/search-selection#anchor-appkit-custom-popovers).
