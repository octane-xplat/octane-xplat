# Layers and overlay contracts

New public APIs in `@octane-xplat/ui` matching the Astryx layer surface:

- `LayerProvider` + `LayerContext`/`useLayerContext` + `LayerToastConfig` — root-mounted toast policy (`position`, `maxVisible`, `inset`); nested providers pass through.
- `usePopover` — headless popover: `triggerRef`/`triggerProps`, `show`/`hide`/`toggle`, `render(children, position)` over `useLayer`.
- `useTooltip` — headless tooltip: `ref`/`positionRef`/`interactionRef`, `describedBy`, `renderTooltip`. Touch targets bind refs but never mount the hint (matches `Tooltip`).
- `useMediaQuery` — web `matchMedia`; iOS/Android evaluate a restricted grammar (`(max|min)-(width|height)`, `pointer`, `hover`, `orientation`, `and`/`or`/`,`/`not`) against the main screen.
- `DropdownMenu`/`ContextMenu` accept `presentation: 'popover' | 'bottom-sheet' | 'adaptive'` and `label`; menu item data gains `description` and `variant: 'destructive'`.
- `useImperativeDialog(defaults)` merges default `DialogOptions` into every `show`.
