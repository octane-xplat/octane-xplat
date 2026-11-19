### Import CSS as text or a URL in native builds

Native Vite builds now handle CSS imports ending in `?raw` or `?url`. These imports previously could fail when the stylesheet processor tried to parse Vite’s generated JavaScript as CSS.

```ts
import cssText from './preview.css?raw'
import cssUrl from './preview.css?url'

console.log(cssText, cssUrl)
```

[Build plugin setup](https://octane-xplat.goddardai.org/package-build)
