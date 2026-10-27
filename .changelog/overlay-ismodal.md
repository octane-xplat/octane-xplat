### Shade-free modal overlays

`Overlay` gains `isModal`: a modal layer without the dimmed shade. It gets
focus isolation and Escape dismissal on web, modal accessibility on iOS, and
Android back dismissal — which now also applies to `shadeCover` overlays.

```tsx
import { Overlay } from '@octane-xplat/ui'

<Overlay open={open} isModal accessibilityLabel="Photo viewer" onDismiss={close}>
	{content}
</Overlay>
```

[Overlay documentation](https://octane-xplat.goddardai.org/components#overlays)
