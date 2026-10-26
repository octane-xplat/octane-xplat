### DropdownMenu takes a `button` prop and renders a real button

`DropdownMenu` now accepts `button` — the shared `Button` props minus the press
handler — so the trigger renders as a real `<button>` on web with correct
`aria-haspopup="menu"`/`aria-expanded`/`disabled` semantics. New `menuWidth`
sets the popover's minimum width (defaulting to the trigger width), and
`hasChevron={false}` drops the trailing chevron that labelled triggers get by
default.

```tsx
<DropdownMenu
	button={{ label: 'Theme', icon: <Icon name="palette" />, variant: 'ghost', size: 'sm', isIconOnly: true }}
	menuWidth={160}
	items={[{ type: 'action', key: 'neutral', label: 'Neutral', onSelect: pick }]}
/>
```

**Breaking change:** `trigger`, `triggerClassName`, `accessibilityLabel`, and
`size` were removed from `DropdownMenuProps`. Pass the trigger as
`button={{ label, icon, variant, size, isIconOnly, … }}` instead. Icon-only
buttons are now square at the size's element height (28/32/36px) instead of a
fixed 36px minimum. `ContextMenu` keeps its own `trigger`/`accessibilityLabel`/
`size`.

[DropdownMenu](https://octane-xplat.dev/app/components/)
