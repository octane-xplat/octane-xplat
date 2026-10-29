### Import shared system-bar helpers on macOS

AppKit root and direct system-bar imports now expose both shared methods without
loading mobile Color helpers. The root previously omitted `setStatusBarStyle`.
Both methods remain unsupported on AppKit: they warn and return void, without
changing window or menu chrome. Native startup and installed-consumer checks
remain pending.

```ts
import { systemBars } from '@octane-xplat/platform/system-bars'

systemBars.setStatusBarStyle('light') // Unsupported on AppKit.
systemBars.setColor('#171717') // No AppKit chrome changes.
```

See [AppKit system-bar limits](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#system-bars-on-appkit).
