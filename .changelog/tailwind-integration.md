### Compile Tailwind classes through Xplat

Install `@octane-xplat/tailwind` as a development dependency to use Tailwind classes. Add its compiler after the platform CSS plugin and import its stylesheet in your global CSS. Native targets accept a smaller set of utilities and values. The build reports unsupported output.

```ts
import { defineConfig } from 'octane-xplat/vite'
import { tailwind } from '@octane-xplat/tailwind/vite'

export default defineConfig({ plugins: [tailwind()] })
```

```css
@import '@octane-xplat/tailwind';
```

[Setup and platform limits](https://octane-xplat.goddardai.org/package-tailwind)
