---
release: lockstep
---

### Navigate when the root Frame is registered after the first render

On iOS and Android, an app that rendered its routes before registering the
root `Frame` could not navigate. Every push failed with
`Native Frame did not become ready`. The router now picks up the Frame when it
is registered, or at the next navigation, whichever comes first.

```ts
import { Application, Frame, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { registerStack } from '@octane-xplat/ui/routing'
import { App } from './App'

Application.run({
	create: () => {
		const frame = new Frame()
		const page = new Page()
		renderNativeScriptApp(page, App)
		frame.navigate({ create: () => page })
		registerStack('root', frame)
		return frame
	},
})
```

[Move between screens](https://octane-xplat.dev/app/navigation/)
