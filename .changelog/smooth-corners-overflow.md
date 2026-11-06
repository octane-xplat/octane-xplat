### Let content extend beyond smooth corners

SmoothCorners now shapes its background and border while leaving child overflow visible by default. Set `overflow: hidden` to clip images and other children to the same curve. The component’s own shadow stays outside the content clip.

**Breaking change:** panels that previously relied on automatic child clipping must now request it explicitly:

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'

export function ClippedPanel() {
  return <SmoothCorners corners={24} style={{ overflow: 'hidden' }}>Clipped content</SmoothCorners>
}
```

[Choose whether to clip content](https://octane-xplat.goddardai.org/package-smooth-corners#clip-an-image-or-other-content).
