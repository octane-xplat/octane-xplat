### Keep native macOS network subscriptions independent

AppKit route updates now reach other subscribers when one listener throws.
Monitored reads reuse the latest sample, and failed native cleanup cannot keep
a retired monitor active. Environment subscriptions release both network and
activity listeners on failure or disposal. The native Services status now stays
subscribed for its screen lifetime.

```ts
import { connectivity } from '@octane-xplat/platform'

export function watchRoute(show: (online: boolean | undefined) => void) {
	return connectivity.subscribe(state => show(state.supported === false ? undefined : state.online))
}
// Release the returned subscription when its screen ends.
```

An available route does not guarantee internet access. Native disconnect/reconnect,
activity delivery and installed-app qualification remain pending. See
[AppKit route updates](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#appkit-route-updates).
