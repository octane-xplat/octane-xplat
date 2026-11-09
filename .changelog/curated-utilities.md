### Import curated utility classes explicitly

Curated helper classes now live in their own optional stylesheet. Apps using classes such as `gap-4`, `text-sm`, `bg-primary`, or `rounded-lg` must add the utility import. The required component structure and optional default decoration remain separate, and components work without the curated helpers.

```ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css' // Optional default decoration.
import '@octane-xplat/ui/theme/utilities.css' // Curated helper classes.
import './app.css'
```

Curated helpers keep their existing text sizes and squircle corners. Their `utilities` layer follows component structure and decoration; unlayered app CSS takes priority on the web. See [Styling screens](https://octane-xplat.goddardai.org/app/styling).
