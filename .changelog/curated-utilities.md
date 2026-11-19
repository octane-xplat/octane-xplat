### Import the built-in utility classes you use

**Breaking change**

If your app uses Xplat’s built-in classes such as `gap-4`, `text-sm`, or `rounded-lg`, import the new utility stylesheet. Keep the required component stylesheet and any optional default styling your app already uses.

```ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css' // Optional default decoration.
import '@octane-xplat/ui/theme/utilities.css' // Curated helper classes.
import './app.css'
```

[Stylesheet setup](https://octane-xplat.goddardai.org/styling#required-structure-and-optional-chrome)
