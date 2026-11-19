### Open web links in the default browser

Use `shell.openExternal()` from a desktop app to hand an HTTP or HTTPS link to the system’s default browser.

```ts
import { shell } from '@octane-xplat/desktop'

if (shell.supported) {
  await shell.openExternal('https://example.org/help')
}
```

See [Open a web link in the default browser](https://octane-xplat.goddardai.org/package-desktop#open-a-web-link-in-the-default-browser).
