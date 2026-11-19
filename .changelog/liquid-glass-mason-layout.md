### Lay out controls directly inside iOS glass

**Breaking change**

Children of `LiquidGlass` and `LiquidGlassContainer` now stack vertically by default. Put flex or grid styles directly on the glass when you need a different layout. Remove wrappers added just to position the contents.

```tsx
import { Image } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function GlassIcon({ icon }: { icon: string }) {
  return (
    <LiquidGlass style={{ width: 72, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Image src={icon} alt="" style={{ width: 24, height: 24 }} />
    </LiquidGlass>
  )
}
```

[LiquidGlass layout guide](https://octane-xplat.goddardai.org/liquid-glass#lay-out-centered-content)
