### Experimental native macOS pages

Pager now has an AppKit source implementation for small onboarding flows and
galleries, replacing its unsupported placeholder. Pages use the native scrolling
viewport, current text direction and reduced-motion preference. Settled user
changes report through the existing callback; programmatic changes do not echo.

```tsx
import { Pager } from '@octane-xplat/pager'
import { Text } from '@octane-xplat/ui'
export function TravelPages() {
	return <Pager items={['Pack', 'Travel']} defaultPage={1}
		style={{ width: 320, height: 160 }} renderItem={(title) => <Text>{title}</Text>} />
}
```

**Breaking change:** Pager requires `@octane-xplat/ui >=0.18.0 <1` for its public
native scrolling API. AppKit renders pages eagerly; use a bounded collection.
Native input/momentum, layout/RTL, focus/accessibility and packaging remain
unqualified. See the [Pager guide](https://github.com/octane-xplat/octane-xplat/tree/main/packages/pager#platform-support).
