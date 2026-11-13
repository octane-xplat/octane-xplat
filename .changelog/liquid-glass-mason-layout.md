### Lay out controls directly inside iOS glass

**Breaking change:** `LiquidGlass` and `LiquidGlassContainer` now use Mason layout and default to block. Children that previously overlapped in one native grid cell now flow vertically. Put flex or grid styles on the material itself, and remove layout wrappers or background siblings added only to position its content.

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

[LiquidGlass layout guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/liquid-glass.md#lay-out-centered-content)
