### The macOS renderer applies your stylesheets

Apps built with `xplatMacOS` now style their AppKit views from CSS. Before,
the renderer only recognized a small built-in list of class names. Import CSS
from your entry module, as on iOS and Android, and `className` selectors,
theme tokens, and Bamboo utilities apply to your views.

```ts
// src/styles.ts, imported by the macOS entry
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import 'virtual:bamboo.css'
import './app.css'
```

Matching rules follow NativeScript, so a class means the same thing on all
three platforms. For CSS built at runtime, call `registerStylesheet(id, css)`
from `@octane-xplat/macos-renderer`. Only `:disabled` responds to state for
now, and animations are not played.

**Breaking change:** the built-in class names (`text-sm`, `gap-2`,
`bg-primary`, `vx-*`, and similar) no longer style anything unless your app
imports the stylesheets that define them.

[Styling](https://octane-xplat.dev/app/styling/)
