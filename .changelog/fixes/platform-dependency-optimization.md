### Keep native dependencies out of web development

Web development now uses the configured platform extension order when Vite prepares dependencies. Packages with browser and native siblings, including SQLite, can stay optimized without pulling native imports into the browser. Existing optimizer extension overrides remain authoritative.

```ts
import { xplatBoundary } from 'octane-xplat/vite'

// In your existing Vite plugins array; the starter already includes this:
const platformResolver = xplatBoundary('web')
```

[Web configuration](https://octane-xplat.goddardai.org/package-toolchain#configure-a-web-app)
