### Compile Tailwind classes through Xplat

`@octane-xplat/tailwind` joins the public lockstep release as an optional build dependency. Add its compiler after the app’s platform CSS preset and import its stylesheet from global CSS. Native generated output is restricted to the documented subset; full native app qualification remains incomplete.

```ts
import { css } from '@octane-xplat/build/vite'
import { tailwind } from '@octane-xplat/tailwind/vite'

const stylingPlugins = [css('web'), tailwind()]
```

```css
@import '@octane-xplat/tailwind';
```

[Setup and platform limits](https://octane-xplat.goddardai.org/package-tailwind)
